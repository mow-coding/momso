import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * momso AI Wiki — 타입드 온톨로지 그래프 회수(server-only).
 *
 * 노드 = published zet(리포트), 엣지 = zet_edge(사람-확정 타입드 관계).
 * 자동 엣지 생성 없음(알파 수동만) — 여기는 읽기 전용 회수만 한다.
 * 무결성: 회수는 RLS owner + workspace_id=ws 이중 스코프, 연결 리포트는 published만.
 * 회수가 끌어온 리포트도 buildContext에서 sources(zet:id)로 귀속 보존된다.
 */

/** 타입드 리포트 엣지 종류(DB check와 동일). 사용자노출 라벨은 컴포넌트가 매핑. */
export type EdgeKind = 'supersedes' | 'related' | 'contraindication' | 'longitudinal'

/** zet_edge 1행(서버 회수형). */
export type ReportEdge = {
  id: string
  fromZet: string
  toZet: string
  kind: EdgeKind
  note: string | null
  createdAt: number
}

/** 엣지로 연결된 리포트 1건 + 연결 메타(buildContext 보강·관계 뷰용). */
export type RelatedReport = {
  edgeId: string
  kind: EdgeKind
  /** seed 기준 방향: 'out'=seed가 from(→가리킴), 'in'=seed가 to(←가리켜짐). */
  direction: 'out' | 'in'
  relatedZetId: string
  title: string
  body: string // 발췌(상한 적용, 컨텍스트 직렬화용)
}

/** 컨텍스트 직렬화용 본문 발췌 상한(rag.ts MAX_CHUNK_CHARS와 동일 감각). */
const RELATED_BODY_CHARS = 1500

const EDGE_KINDS: EdgeKind[] = ['supersedes', 'related', 'contraindication', 'longitudinal']
const isEdgeKind = (k: string): k is EdgeKind => (EDGE_KINDS as string[]).includes(k)

type EdgeRow = {
  id: string
  from_zet: string
  to_zet: string
  kind: string
  note: string | null
  created_at: string
}

const toEdge = (r: EdgeRow): ReportEdge => ({
  id: r.id,
  fromZet: r.from_zet,
  toZet: r.to_zet,
  kind: (isEdgeKind(r.kind) ? r.kind : 'related') as EdgeKind,
  note: r.note,
  createdAt: new Date(r.created_at).getTime(),
})

/** owner+ws 스코프 전체 엣지 회수(관계 그래프 뷰 데이터). RLS=owner가 추가 격리. */
export async function listEdges(sb: SupabaseClient, ws: string): Promise<ReportEdge[]> {
  if (!ws) return []
  const { data, error } = await sb
    .from('zet_edge')
    .select('id, from_zet, to_zet, kind, note, created_at')
    .eq('workspace_id', ws)
    .order('created_at', { ascending: false })
  if (error) {
    console.error('listEdges', error.message)
    return []
  }
  return ((data as EdgeRow[] | null) ?? []).map(toEdge)
}

/**
 * seed 리포트들의 1-홉 엣지 확장(from/to 양방향 union).
 * 연결 리포트는 published만, owner+ws 스코프. seedZetIds 자신은 결과에서 제외.
 * buildContext 그래프 보강의 (b) 단계.
 */
export async function relatedReports(
  sb: SupabaseClient,
  ws: string,
  seedZetIds: string[],
): Promise<RelatedReport[]> {
  if (!ws || seedZetIds.length === 0) return []
  const seeds = Array.from(new Set(seedZetIds))
  const seedSet = new Set(seeds)
  const inList = `(${seeds.join(',')})`

  // seed가 from 또는 to인 모든 엣지(양방향 union, ws 스코프, RLS=owner).
  const { data, error } = await sb
    .from('zet_edge')
    .select('id, from_zet, to_zet, kind, note, created_at')
    .eq('workspace_id', ws)
    .or(`from_zet.in.${inList},to_zet.in.${inList}`)
  if (error) {
    console.error('relatedReports edges', error.message)
    return []
  }
  const edges = ((data as EdgeRow[] | null) ?? []).map(toEdge)
  if (edges.length === 0) return []

  // seed가 아닌 쪽(연결 상대) id 집합 + seed 기준 방향.
  type Hit = { edgeId: string; kind: EdgeKind; direction: 'out' | 'in'; relatedZetId: string }
  const hits: Hit[] = []
  for (const e of edges) {
    const fromSeed = seedSet.has(e.fromZet)
    const toSeed = seedSet.has(e.toZet)
    // seed→other (out): seed가 from
    if (fromSeed && !seedSet.has(e.toZet)) {
      hits.push({ edgeId: e.id, kind: e.kind, direction: 'out', relatedZetId: e.toZet })
    }
    // other→seed (in): seed가 to
    if (toSeed && !seedSet.has(e.fromZet)) {
      hits.push({ edgeId: e.id, kind: e.kind, direction: 'in', relatedZetId: e.fromZet })
    }
  }
  if (hits.length === 0) return []

  // 연결 상대 리포트 본문 회수 — published만, owner+ws 스코프.
  const relatedIds = Array.from(new Set(hits.map((h) => h.relatedZetId)))
  const { data: zetData, error: zetErr } = await sb
    .from('zet')
    .select('id, title, body, status')
    .eq('workspace_id', ws)
    .eq('status', 'published')
    .in('id', relatedIds)
  if (zetErr) {
    console.error('relatedReports zet', zetErr.message)
    return []
  }
  type ZetLite = { id: string; title: string; body: string; status: string }
  const byId = new Map<string, ZetLite>()
  for (const z of (zetData as ZetLite[] | null) ?? []) byId.set(z.id, z)

  const out: RelatedReport[] = []
  for (const h of hits) {
    const z = byId.get(h.relatedZetId)
    if (!z) continue // draft이거나 스코프 밖 → 제외(published만)
    out.push({
      edgeId: h.edgeId,
      kind: h.kind,
      direction: h.direction,
      relatedZetId: z.id,
      title: z.title,
      body: (z.body ?? '').slice(0, RELATED_BODY_CHARS),
    })
  }
  return out
}