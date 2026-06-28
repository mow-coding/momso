import { NextResponse } from 'next/server'

import { routeClient } from '@/lib/supabase/route'
import {
  verifyProvisioned,
  encryptServiceKey,
  maskUrl,
  type CustomerConfig,
} from '@/lib/customerdb'

/**
 * BYO 데이터 분리(알파) — 고객 Supabase 연결 라우트.
 *   POST: 연결 저장(service key AES-256-GCM 암호화) + 스키마 주입/검증 시도.
 *   GET:  연결 상태(connected/provisioned/urlMasked). 키·암호문 반환 절대 금지.
 *   DELETE: 연결 해제(이후 데이터 op은 중앙 momso-alpha 폴백).
 *
 * 보안: service key는 절대 브라우저에 안 닿음 → 중앙 customer_db에 암호화 저장, 여기서만 복호화.
 *   node:crypto·service 클라 → nodejs 런타임. 인증=routeClient(중앙 Bearer→getUser),
 *   owner는 서버가 ctx.userId로 강제(위조 차단).
 */
export const runtime = 'nodejs'

type ConnectBody = { url?: unknown; anonKey?: unknown; serviceKey?: unknown }

const isHttpsUrl = (s: string): boolean => {
  try {
    return new URL(s).protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * POST {url, anonKey, serviceKey}:
 *   1) routeClient 인증, 2) serviceKey AES-GCM 암호화,
 *   3) customer_db upsert(onConflict:'owner'){supabase_url,anon_key,iv,ciphertext,auth_tag,
 *      connected_at:now, provisioned:false, updated_at:now},
 *   4) verifyProvisioned probe — 고객이 스키마를 적용해 뒀으면 provisioned=true.
 *   미적용이어도 연결 저장은 유지(provisioned=false). 키 평문/암호문 일절 반환 금지.
 */
export async function POST(req: Request): Promise<Response> {
  let ctx
  try {
    ctx = await routeClient(req)
  } catch {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  let body: ConnectBody
  try {
    body = (await req.json()) as ConnectBody
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const url = typeof body.url === 'string' ? body.url.trim().replace(/\/+$/, '') : ''
  const anonKey = typeof body.anonKey === 'string' ? body.anonKey.trim() : ''
  const serviceKey = typeof body.serviceKey === 'string' ? body.serviceKey.trim() : ''

  if (!url || !anonKey || !serviceKey) {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 })
  }
  if (!isHttpsUrl(url)) {
    return NextResponse.json({ error: 'invalid_url' }, { status: 400 })
  }

  // service key 암호화(평문은 절대 DB/응답에 닿지 않음). 마스터키 미설정 등 → 500.
  let blob
  try {
    blob = encryptServiceKey(serviceKey)
  } catch {
    return NextResponse.json({ error: 'encryption_unavailable' }, { status: 500 })
  }

  const now = new Date().toISOString()
  // 1) 연결 저장(스키마와 독립). provisioned는 항상 false로 저장 후 주입 결과로만 true 승격.
  const { error: upErr } = await ctx.sb.from('customer_db').upsert(
    {
      owner: ctx.userId,
      supabase_url: url,
      anon_key: anonKey,
      iv: blob.iv,
      ciphertext: blob.ciphertext,
      auth_tag: blob.authTag,
      connected_at: now,
      provisioned: false,
      updated_at: now,
    },
    { onConflict: 'owner' },
  )
  if (upErr) {
    return NextResponse.json({ error: 'save_failed' }, { status: 500 })
  }

  // 2) 스키마 적용 여부 검증 — 연결 저장과 분리. 고객이 customer-db-schema.sql을 본인 Supabase에
  //    적용했는지 probe로 확인만 한다(임의 DDL 자동 주입 안 함). 미적용이어도 연결은 유지
  //    (provisioned=false), 데이터는 중앙 폴백으로 안전 보관.
  const cfg: CustomerConfig = { url, anonKey, serviceKey }
  let provisioned = false
  let reason: string | undefined
  try {
    provisioned = await verifyProvisioned(cfg)
    if (!provisioned) reason = 'SCHEMA_NOT_APPLIED'
  } catch (e) {
    // 고객 Supabase 접근 자체 실패(URL/키 오류 등) — 연결은 저장됨, 미적용 상태로 둔다.
    console.error('customer-db:verify', e instanceof Error ? e.message : String(e))
    provisioned = false
    reason = 'PROVISION_FAILED'
  }

  if (provisioned) {
    const { error: flagErr } = await ctx.sb
      .from('customer_db')
      .update({ provisioned: true, updated_at: new Date().toISOString() })
      .eq('owner', ctx.userId)
    if (flagErr) {
      // 플래그 갱신 실패는 치명적이지 않음(연결은 저장됨) — 다음 GET/POST에서 재판정.
      console.error('customer-db:flag', JSON.stringify(flagErr))
    }
  }

  return NextResponse.json({ ok: true, provisioned, ...(reason ? { reason } : {}) })
}

/** GET → CustomerStatus { connected, provisioned, urlMasked }. 키·암호문 절대 반환 금지. */
export async function GET(req: Request): Promise<Response> {
  let ctx
  try {
    ctx = await routeClient(req)
  } catch {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const { data, error } = await ctx.sb
    .from('customer_db')
    .select('supabase_url, provisioned')
    .eq('owner', ctx.userId)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: 'lookup_failed' }, { status: 500 })
  }
  if (!data) {
    return NextResponse.json({ connected: false, provisioned: false, urlMasked: null })
  }

  const rawUrl = (data.supabase_url as string | null) ?? ''
  return NextResponse.json({
    connected: true,
    provisioned: Boolean(data.provisioned),
    urlMasked: rawUrl ? maskUrl(rawUrl) : null,
  })
}

/** DELETE → customer_db 1행 delete(연결 해제). { ok:true }. 이후 데이터 op은 중앙 폴백. */
export async function DELETE(req: Request): Promise<Response> {
  let ctx
  try {
    ctx = await routeClient(req)
  } catch {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const { error } = await ctx.sb.from('customer_db').delete().eq('owner', ctx.userId)
  if (error) {
    return NextResponse.json({ error: 'delete_failed' }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
