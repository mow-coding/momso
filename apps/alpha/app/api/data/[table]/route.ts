import { NextResponse } from 'next/server'

import { routeClient } from '@/lib/supabase/route'
import { loadCustomerConfig, customerAdminClient, verifyProvisioned } from '@/lib/customerdb'

// ─────────────────────────────────────────────────────────────────────────────
// BYO 데이터 분리(알파) — 데이터 op 서버 프록시 *골격*(잠긴 아키텍처 §1, 옵션 a).
//
//   service-role 키는 절대 브라우저에 안 닿음 → 데이터 op이 고객 Supabase로 가야 할 땐
//   이 서버 라우트가 대리 수행한다. 라우트는 먼저 routeClient(중앙 Bearer)로 호출자 정체(userId)를
//   검증하고, 그 userId를 owner로 *코드 강제 주입*해 고객 service 클라로 CRUD를 대리한다.
//   → service key가 RLS를 우회하더라도 owner 스코프는 서버가 코드로 강제(위조 차단).
//
// 정직한 알파 범위(잠긴 아키텍처 §1 골격):
//   - 이 라우트는 라우팅 *골격*이다. store.ts 각 op(objet/zet/zet_edge/entity)의 프록시 전환은
//     후속 슬라이스로 분리한다(현재 store는 getSupabase 직결=중앙 폴백 유지).
//   - 미연결/미적용(provisioned=false)이면 데이터 op은 중앙 폴백이 안전 기본값 →
//     이 라우트는 그 경우 명시적으로 'central_fallback'을 신호하고 고객 DB로 라우팅하지 않는다.
//   - 연결+provisioned일 때만 고객 DB로 owner 스코프 CRUD를 대리한다.
//
// 보안: node:crypto(복호화)·service 클라 → nodejs 런타임. owner는 ctx.userId로 강제(body 무시).
// ─────────────────────────────────────────────────────────────────────────────
export const runtime = 'nodejs'

/**
 * 프록시 허용 데이터 테이블 — owner 컬럼 + created_at 보유(제네릭 owner-스코프 처리 가능).
 * zet_link·entity_alias는 owner 컬럼이 없는 자식 테이블(부모 zet/entity로 스코프)이라
 *   이 제네릭 프록시 대상이 아니다 — 부모와 함께 고객 DB로 보내는 처리는 후속 슬라이스.
 */
const ALLOWED = new Set(['objet', 'zet', 'zet_edge', 'entity', 'embedding'])

type ProxyBody = {
  op?: 'select' | 'insert' | 'update' | 'delete'
  /** workspace 스코프(읽기/쓰기 모두 활성 워크스페이스로 제한). */
  workspaceId?: string
  /** insert/update 페이로드(owner는 서버가 강제 주입 — body의 owner는 무시). */
  values?: Record<string, unknown>
  /** update/delete 대상 행 id(owner+ws 스코프와 AND). */
  id?: string
}

/**
 * 호출자의 고객 연결을 로드하고, provisioned면 owner-스코프 service 클라 컨텍스트를 만든다.
 * 미연결/미적용이면 null(라우트는 'central_fallback'로 응답 — 고객 DB 라우팅 금지).
 */
async function customerContext(ctx: Awaited<ReturnType<typeof routeClient>>) {
  const cfg = await loadCustomerConfig(ctx)
  if (!cfg) return null
  // provisioned 재확인(스키마 미적용 고객 DB로 라우팅해 0행/유실 내는 것 방지 — §3 안전 기본값).
  const ready = await verifyProvisioned(cfg)
  if (!ready) return null
  return { admin: customerAdminClient(cfg), userId: ctx.userId }
}

/**
 * POST /api/data/[table]  — 데이터 op 프록시(골격).
 *   인증(routeClient) → 화이트리스트 검증 → 고객 연결 로드.
 *   미연결/미적용 → { routed:'central_fallback' }(클라가 중앙 직결로 처리, 현 동작 보존).
 *   연결+provisioned → owner=ctx.userId 강제 주입해 고객 service 클라로 CRUD 대리.
 */
export async function POST(req: Request, context: { params: Promise<{ table: string }> }): Promise<Response> {
  const { table } = await context.params
  if (!ALLOWED.has(table)) {
    return NextResponse.json({ error: 'table_not_allowed' }, { status: 400 })
  }

  let ctx
  try {
    ctx = await routeClient(req)
  } catch {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  let body: ProxyBody
  try {
    body = (await req.json()) as ProxyBody
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const cust = await customerContext(ctx)
  if (!cust) {
    // 미연결/미적용 — 고객 DB로 라우팅하지 않는다(중앙 폴백 신호). 클라가 getSupabase로 직결 처리.
    return NextResponse.json({ routed: 'central_fallback' })
  }

  const { admin, userId } = cust
  const op = body.op ?? 'select'
  const wsId = typeof body.workspaceId === 'string' ? body.workspaceId : null

  try {
    if (op === 'select') {
      let q = admin.from(table).select('*').eq('owner', userId)
      if (wsId) q = q.eq('workspace_id', wsId)
      const { data, error } = await q.order('created_at', { ascending: false })
      if (error) throw error
      return NextResponse.json({ routed: 'customer', data: data ?? [] })
    }

    if (op === 'insert') {
      // owner는 서버가 강제 주입(body.owner 무시 — 위조 차단). ws 스코프도 서버가 채운다.
      const values = { ...(body.values ?? {}), owner: userId, ...(wsId ? { workspace_id: wsId } : {}) }
      const { data, error } = await admin.from(table).insert(values).select().single()
      if (error) throw error
      return NextResponse.json({ routed: 'customer', data })
    }

    if (op === 'update') {
      if (!body.id) return NextResponse.json({ error: 'missing_id' }, { status: 400 })
      const patch = { ...(body.values ?? {}) }
      delete (patch as Record<string, unknown>).owner // owner는 변경 불가
      let q = admin.from(table).update(patch).eq('id', body.id).eq('owner', userId)
      if (wsId) q = q.eq('workspace_id', wsId)
      const { data, error } = await q.select().single()
      if (error) throw error
      return NextResponse.json({ routed: 'customer', data })
    }

    if (op === 'delete') {
      if (!body.id) return NextResponse.json({ error: 'missing_id' }, { status: 400 })
      let q = admin.from(table).delete().eq('id', body.id).eq('owner', userId)
      if (wsId) q = q.eq('workspace_id', wsId)
      const { error } = await q
      if (error) throw error
      return NextResponse.json({ routed: 'customer', ok: true })
    }

    return NextResponse.json({ error: 'bad_op' }, { status: 400 })
  } catch (e) {
    console.error('data-proxy', table, op, e instanceof Error ? e.message : String(e))
    return NextResponse.json({ error: 'proxy_failed' }, { status: 502 })
  }
}
