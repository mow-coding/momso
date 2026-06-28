import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'
import type { LlmProvider } from './llm/types'
import { relatedReports, type EdgeKind, type RelatedReport } from './graph'

/** 엣지 1-홉 확장 리포트 수 상한(컨텍스트 토큰 폭주 방지). seed 합산 전체 기준. */
const EDGE_FANOUT_CAP = 12

/** 엣지 종류 → 컨텍스트 라벨(서버 직렬화용; 사용자노출 UI 라벨과 별개). */
const EDGE_CONTEXT_LABEL: Record<EdgeKind, string> = {
  supersedes: '최신본',
  related: '관련',
  contraindication: '금기 동반',
  longitudinal: '종단',
}

/**
 * RAG (길B 대화발 + 길A grounding) — server-only.
 *
 * 무결성 불변식: AI는 근거(원본 스팬/위키 노드)가 뒷받침하는 것만 단정.
 * buildContext가 회수한 sources만 답변 인용에 쓰이며, 결과 0이면 context=''로
 * "근거 없음"을 정직히 전달(빈 위키에서도 동작). 가짜 근거 생성 금지.
 */

/** 청크 길이 상한(문자). 길면 EMBED 입력이 잘리거나 의미가 흐려짐. */
const MAX_CHUNK_CHARS = 1500

/**
 * 텍스트를 임베딩 단위 청크로 분할.
 * 1) 문단(\n\n) 우선 분할 → 2) 상한 초과 문단은 길이 기반 재분할 → 3) 빈 청크 제거.
 */
export function chunk(text: string): string[] {
  if (!text) return []
  const paragraphs = text.split(/\n\s*\n/)
  const out: string[] = []
  for (const raw of paragraphs) {
    const p = raw.trim()
    if (!p) continue
    if (p.length <= MAX_CHUNK_CHARS) {
      out.push(p)
      continue
    }
    // 상한 초과 문단: 길이 기반 재분할(가능하면 공백 경계에서 끊음).
    let rest = p
    while (rest.length > MAX_CHUNK_CHARS) {
      let cut = rest.lastIndexOf(' ', MAX_CHUNK_CHARS)
      if (cut <= 0) cut = MAX_CHUNK_CHARS
      const piece = rest.slice(0, cut).trim()
      if (piece) out.push(piece)
      rest = rest.slice(cut).trim()
    }
    if (rest) out.push(rest)
  }
  return out
}

/** RAG 회수 근거 1건(출처 귀속 보존). */
export type RagSource = {
  sourceType: 'objet' | 'zet'
  sourceId: string
  content: string
  similarity: number
}

type MatchRow = {
  source_type: string
  source_id: string
  content: string
  similarity: number
}

type LexRow = { source_type: string; source_id: string; content: string; score: number }

/** RRF 표준 상수(k=60). 순위 가산 1/(RRF_K + rank)에서 상위권 변별·하위권 완만함 균형. */
const RRF_K = 60

/**
 * 활성 워크스페이스 스코프로 query에 가장 가까운 근거를 회수(+ 관계 그래프 1-홉 보강).
 * (a) provider.embed([query]) → match_embedding RPC(RLS=유저, ws 스코프) → 상위 k.
 * (b) includeEdges 시 그 근거 중 zet(리포트) seed의 zet_edge 1-홉을 확장해 함께 비춤
 *     — supersedes는 최신본 우선, contraindication(금기)은 누락 없이 동반 표기.
 * 자동 엣지 생성은 없음(읽기만). ws 없거나 결과 0이면 { context: '', sources: [] }(정직한 "근거 없음").
 *
 * 기존 chat 라우트는 5-인자 positional 호출 → includeEdges는 6번째 optional(기본 ON).
 */
export async function buildContext(
  sb: SupabaseClient,
  provider: LlmProvider,
  ws: string,
  query: string,
  k: number,
  includeEdges = true,
): Promise<{ context: string; sources: RagSource[] }> {
  const q = query?.trim()
  if (!ws || !q) return { context: '', sources: [] }

  const vectors = await provider.embed([q])
  const queryEmbedding = vectors[0]
  if (!queryEmbedding || queryEmbedding.length === 0) {
    return { context: '', sources: [] }
  }

  // 두 회수 병행: (1) 벡터 KNN(의미), (2) 어휘 FTS(키워드). 각 리스트에서 넉넉히 뽑아 RRF로 융합.
  //   어휘는 안전 recall — 임베딩이 놓치는 정확 키워드(자세명·금기)를 보강. lexical은 best-effort.
  const pool = Math.max(k * 3, 20)
  const [vecRes, lexRes] = await Promise.all([
    sb.rpc('match_embedding', { query_embedding: queryEmbedding, ws, match_count: pool }),
    sb.rpc('lexical_match', { q, ws, match_count: pool }),
  ])
  if (vecRes.error) throw new Error(`match_embedding RPC 실패: ${vecRes.error.message}`)
  const vecRows = (vecRes.data as MatchRow[] | null) ?? []
  // lexical_match가 없거나(구버전 DB) 실패해도 벡터만으로 동작(정직한 degrade).
  const lexRows = lexRes.error ? [] : ((lexRes.data as LexRow[] | null) ?? [])

  const sources: RagSource[] = rrfFuse(vecRows, lexRows, k)
  if (sources.length === 0) return { context: '', sources: [] }

  // 직렬화: 각 근거에 출처 라벨(source_type:source_id)을 붙여 모델이 인용 시 귀속을 보존하도록.
  const blocks = sources.map(
    (s, i) => `[${i + 1} · 근거 · ${s.sourceType}:${s.sourceId}]\n${s.content}`,
  )

  // ── 관계 그래프 1-홉 보강(읽기만; 출처 귀속 zet:id 보존) ──────
  if (includeEdges) {
    const seedZetIds = Array.from(
      new Set(sources.filter((s) => s.sourceType === 'zet').map((s) => s.sourceId)),
    )
    if (seedZetIds.length > 0) {
      const related = await relatedReports(sb, ws, seedZetIds)
      // 이미 vector로 회수된 리포트는 sourceId 기준 dedupe(중복 인용·토큰 낭비 방지).
      const seen = new Set(sources.map((s) => s.sourceId))
      const expansions = mergeRelated(related, seen)
      for (const r of expansions) {
        // 엣지 확장분도 sources에 zet로 포함 → 답변 인용·UI 출처표시가 그래프 확장분까지 귀속.
        sources.push({ sourceType: 'zet', sourceId: r.relatedZetId, content: r.body, similarity: 0 })
        seen.add(r.relatedZetId)
        const label = EDGE_CONTEXT_LABEL[r.kind]
        // 번호는 sources 인덱스와 1:1(사후가드가 [N] 인용을 sources[N-1]로 검증).
        blocks.push(`[${sources.length} · 관련 리포트 · ${label} · zet:${r.relatedZetId}]\n${r.body}`)
      }
    }
  }

  return { context: blocks.join('\n\n'), sources }
}

/**
 * 엣지 확장분 병합 규칙 — supersedes 최신본 우선, contraindication 누락 금지, 상한 적용.
 *  - supersedes: seed가 가리키는 구버전(direction 'out')은 강등(제외), seed를 가리키는
 *    신버전(direction 'in')은 "최신본"으로 우선 포함. 즉 supersedes 체인의 최신 노드를 대표로.
 *  - 그 외(related/contraindication/longitudinal): 그대로 포함.
 *  - seen(이미 회수된 sourceId)·동일 relatedZetId 중복 제거 후 EDGE_FANOUT_CAP까지.
 */
function mergeRelated(related: RelatedReport[], seen: Set<string>): RelatedReport[] {
  const picked: RelatedReport[] = []
  const usedIds = new Set(seen)
  // 금기는 안전상 누락 금지 → 우선 통과시키기 위해 정렬(금기 먼저, 그다음 최신본).
  const order: Record<EdgeKind, number> = {
    contraindication: 0,
    supersedes: 1,
    related: 2,
    longitudinal: 3,
  }
  const sorted = [...related].sort((a, b) => order[a.kind] - order[b.kind])
  for (const r of sorted) {
    if (picked.length >= EDGE_FANOUT_CAP) break
    // supersedes 구버전(seed→to: out)은 강등 — 인용은 최신본(in) 우선.
    if (r.kind === 'supersedes' && r.direction === 'out') continue
    if (usedIds.has(r.relatedZetId)) continue
    picked.push(r)
    usedIds.add(r.relatedZetId)
  }
  return picked
}

/**
 * 두 랭킹(벡터·어휘)을 Reciprocal Rank Fusion으로 융합 → 상위 limit.
 *   점수 = Σ 1/(RRF_K + rank)  (각 리스트의 0-based rank). 키 = 청크(source_type:source_id:content).
 *   한 모달에만 잡혀도 살아남고, 둘 다 잡으면 가산 → 의미·키워드 양쪽 강점 결합(안전 recall).
 */
function rrfFuse(vec: MatchRow[], lex: LexRow[], limit: number): RagSource[] {
  const acc = new Map<
    string,
    { type: 'objet' | 'zet'; id: string; content: string; rrf: number; sim: number }
  >()
  const fold = (
    rows: { source_type: string; source_id: string; content: string }[],
    simOf: (i: number) => number,
  ) => {
    rows.forEach((r, i) => {
      if (r.source_type !== 'objet' && r.source_type !== 'zet') return
      const key = `${r.source_type}:${r.source_id}:${r.content}`
      const inc = 1 / (RRF_K + i + 1)
      const cur = acc.get(key)
      if (cur) {
        cur.rrf += inc
        cur.sim = Math.max(cur.sim, simOf(i))
      } else {
        acc.set(key, { type: r.source_type, id: r.source_id, content: r.content, rrf: inc, sim: simOf(i) })
      }
    })
  }
  fold(vec, (i) => vec[i]?.similarity ?? 0)
  fold(lex, () => 0)
  return Array.from(acc.values())
    .sort((a, b) => b.rrf - a.rrf)
    .slice(0, limit)
    .map((e) => ({ sourceType: e.type, sourceId: e.id, content: e.content, similarity: e.sim }))
}