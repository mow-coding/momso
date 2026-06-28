import { useSyncExternalStore } from 'react'
import { getSupabase } from './supabase/client'
import { activeWorkspaceId } from './workspace'

// ── 파일 종류(업로드 시 태깅) ───────────────────────────────
export type FileKind =
  | 'class_audio'
  | 'class_transcript'
  | 'class_processed'
  | 'class_summary'
  | 'philosophy'
  | 'textbook'
  | 'reference'
  | 'student'
  | 'schedule'
  | 'ops'

export const FILE_KINDS: { key: FileKind; group: 'Ⅰ 수업' | 'Ⅱ 지식·콘텐츠' | 'Ⅲ 운영·CRM'; label: string }[] = [
  { key: 'class_audio', group: 'Ⅰ 수업', label: '음성 원본' },
  { key: 'class_transcript', group: 'Ⅰ 수업', label: '전사본' },
  { key: 'class_processed', group: 'Ⅰ 수업', label: '가공본' },
  { key: 'class_summary', group: 'Ⅰ 수업', label: '요약본' },
  { key: 'philosophy', group: 'Ⅱ 지식·콘텐츠', label: '철학 문서' },
  { key: 'textbook', group: 'Ⅱ 지식·콘텐츠', label: '교재' },
  { key: 'reference', group: 'Ⅱ 지식·콘텐츠', label: '참고 자료' },
  { key: 'student', group: 'Ⅲ 운영·CRM', label: '수련생 신상' },
  { key: 'schedule', group: 'Ⅲ 운영·CRM', label: '수업 편성표' },
  { key: 'ops', group: 'Ⅲ 운영·CRM', label: '운영 기타' },
]

export const isClassKind = (k: FileKind) => k.startsWith('class_')

// ── AI Wiki 클라 타입 (서버 라우트 응답 — 컴포넌트가 import) ──
/** RAG가 회수한 근거(출처). 무결성: 답변은 이 출처가 뒷받침하는 것만. */
export type RagSource = {
  sourceType: 'objet' | 'zet'
  sourceId: string
  content: string
  similarity: number
}

/** 보정 단계 화자 매핑 — diarization(raw) ≠ 정체(identity). 확신 없으면 role='unknown'. */
export type SpeakerMap = {
  raw: string
  role: 'member' | 'teacher' | 'unknown'
  identity?: string
}

/** 보정 단계 용어 교정(몸소 딕셔너리 기반). */
export type TermFix = { from: string; to: string }

/** 몸소 기본 딕셔너리(dictionary_term scope='base') 항목 — 설정 화면 표시용. */
export type BaseDictTerm = {
  term: string
  reading: string | null
  category: string | null
  note: string | null
}

/** 기본 제공 요가 용어집 읽기(인증 사용자, RLS=base 읽기 허용). */
export async function listBaseDictionary(): Promise<BaseDictTerm[]> {
  const sb = getSupabase()
  if (!sb) return []
  const { data, error } = await sb
    .from('dictionary_term')
    .select('term, reading, category, note')
    .eq('scope', 'base')
    .order('category', { ascending: true })
    .order('term', { ascending: true })
  if (error) {
    console.error('listBaseDictionary', JSON.stringify(error))
    return []
  }
  return (data as BaseDictTerm[]) ?? []
}

/** AI 초점 조각 — 근거 sourceSpan 없는 조각은 서버에서 제외(무결성). */
export type Focus = {
  text: string
  speakerRole: 'member' | 'teacher' | 'excluded' | 'unknown'
  sourceSpan: string
}

/** 발행 리포트의 구조화 출처 — 주장별 근거 스팬 + 화자 역할(post-publish 감사·무결성 게이트). */
export type SourceRef = { span: string; role: string }

// ── 도메인 타입 (DB objet/zet 매핑) ──────────────────────────
export type Objet = {
  id: string
  kind: FileKind
  title: string
  body?: string
  fileName?: string
  createdAt: number
}

export type Zet = {
  id: string
  title: string
  body: string
  status: 'draft' | 'published'
  source: 'class' | 'chat'
  objetId?: string
  createdAt: number
  publishedAt?: number
}

type DB = { objets: Objet[]; zets: Zet[]; loaded: boolean }

// ── 외부 스토어 — 진짜 Supabase 백엔드, 활성 워크스페이스 스코프 ──
let db: DB = { objets: [], zets: [], loaded: false }
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())
const subscribe = (cb: () => void) => {
  listeners.add(cb)
  return () => {
    listeners.delete(cb)
  }
}
const getSnapshot = () => db

export function useDB() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}

// ── DB row → 도메인 매핑 ─────────────────────────────────────
type ObjetRow = { id: string; kind: string; title: string; body: string | null; file_name: string | null; created_at: string }
type ZetRow = {
  id: string
  title: string
  body: string
  status: string
  source: string
  objet_id: string | null
  created_at: string
  published_at: string | null
}

const toObjet = (r: ObjetRow): Objet => ({
  id: r.id,
  kind: r.kind as FileKind,
  title: r.title,
  body: r.body ?? undefined,
  fileName: r.file_name ?? undefined,
  createdAt: new Date(r.created_at).getTime(),
})

const toZet = (r: ZetRow): Zet => ({
  id: r.id,
  title: r.title,
  body: r.body,
  status: r.status as Zet['status'],
  source: r.source as Zet['source'],
  objetId: r.objet_id ?? undefined,
  createdAt: new Date(r.created_at).getTime(),
  publishedAt: r.published_at ? new Date(r.published_at).getTime() : undefined,
})

/** select(워크스페이스 스코프) + 토큰 갱신 레이스(401) 대비 1회 재시도. */
async function selectAll(sb: NonNullable<ReturnType<typeof getSupabase>>, table: 'objet' | 'zet', wsId: string) {
  const q = () => sb.from(table).select('*').eq('workspace_id', wsId).order('created_at', { ascending: false })
  let res = await q()
  if (res.error) {
    await sb.auth.getSession()
    res = await q()
  }
  return res
}

/** 활성 워크스페이스의 objet/zet 로드(RLS=owner + 스코프=workspace). */
export async function loadDB(): Promise<void> {
  const sb = getSupabase()
  const wsId = activeWorkspaceId()
  if (!sb || !wsId) {
    db = { objets: [], zets: [], loaded: true }
    emit()
    return
  }
  const [objetRes, zetRes] = await Promise.all([selectAll(sb, 'objet', wsId), selectAll(sb, 'zet', wsId)])
  if (objetRes.error) console.error('loadDB objet', JSON.stringify(objetRes.error))
  if (zetRes.error) console.error('loadDB zet', JSON.stringify(zetRes.error))
  db = {
    objets: ((objetRes.data as ObjetRow[] | null) ?? []).map(toObjet),
    zets: ((zetRes.data as ZetRow[] | null) ?? []).map(toZet),
    loaded: true,
  }
  emit()
}

export function clearDB(): void {
  db = { objets: [], zets: [], loaded: false }
  emit()
}

// ── 액션 (owner=auth.uid() 자동 · workspace_id=활성 워크스페이스) ──
export async function addObjet(input: {
  kind: FileKind
  title: string
  body?: string
  fileName?: string
}): Promise<Objet | null> {
  const sb = getSupabase()
  const wsId = activeWorkspaceId()
  if (!sb || !wsId) return null
  const { data, error } = await sb
    .from('objet')
    .insert({
      kind: input.kind,
      title: input.title,
      body: input.body ?? null,
      file_name: input.fileName ?? null,
      workspace_id: wsId,
    })
    .select()
    .single()
  if (error || !data) {
    console.error('addObjet', JSON.stringify(error))
    return null
  }
  const o = toObjet(data as ObjetRow)
  db = { ...db, objets: [o, ...db.objets] }
  emit()
  // 텍스트 본문이 있으면 자동 임베딩(best-effort: 실패해도 업로드는 성공).
  // 무결성 grounding "AI는 다 본다" — 보존된 원본은 RAG 대상.
  if (o.body && o.body.trim().length > 0) {
    void embedSource('objet', o.id).catch((e) => console.error('embedSource(objet)', e))
  }
  return o
}

export async function addZet(input: {
  title: string
  body: string
  source: 'class' | 'chat'
  status?: 'draft' | 'published'
  objetId?: string
  correctedId?: string // 발행 계보: 어느 보정본(L2)에서 나왔나
  sourceRefs?: SourceRef[] // 구조화 출처(주장별 근거 스팬)
}): Promise<Zet | null> {
  const sb = getSupabase()
  const wsId = activeWorkspaceId()
  if (!sb || !wsId) return null
  const status = input.status ?? 'draft'
  const { data, error } = await sb
    .from('zet')
    .insert({
      title: input.title,
      body: input.body,
      source: input.source,
      status,
      objet_id: input.objetId ?? null,
      corrected_id: input.correctedId ?? null,
      source_refs: input.sourceRefs ?? [],
      workspace_id: wsId,
      published_at: status === 'published' ? new Date().toISOString() : null,
    })
    .select()
    .single()
  if (error || !data) {
    console.error('addZet', JSON.stringify(error))
    return null
  }
  const z = toZet(data as ZetRow)
  db = { ...db, zets: [z, ...db.zets] }
  emit()
  // 발행된 리포트는 RAG grounding·그래프 노드로 색인(§6 "AI는 다 본다", §1③ 그래프 활성화).
  // best-effort: 실패해도 발행은 성공. embed 라우트가 기존 행 교체(idempotent).
  if (z.status === 'published' && z.body.trim().length > 0) {
    void embedSource('zet', z.id).catch((e) => console.error('embedSource(zet)', e))
  }
  return z
}

export async function updateZet(
  id: string,
  patch: { title?: string; body?: string; status?: 'draft' | 'published' },
): Promise<void> {
  const sb = getSupabase()
  if (!sb) return
  const upd: Record<string, unknown> = { ...patch }
  if (patch.status === 'published') upd.published_at = new Date().toISOString()
  const { data, error } = await sb.from('zet').update(upd).eq('id', id).select().single()
  if (error || !data) {
    console.error('updateZet', JSON.stringify(error))
    return
  }
  const z = toZet(data as ZetRow)
  db = { ...db, zets: db.zets.map((x) => (x.id === id ? z : x)) }
  emit()
  // 발행(또는 발행 상태로 갱신) 시 grounding·그래프 색인. embed 라우트가 기존 행 교체(idempotent).
  if (z.status === 'published' && z.body.trim().length > 0) {
    void embedSource('zet', z.id).catch((e) => console.error('embedSource(zet)', e))
  }
}

/**
 * 北極星(앵커링): 검수·발행 기록 재방문(revisit) 등 KPI 이벤트 로깅.
 *   owner=auth.uid() 자동 스탬핑(RLS), 워크스페이스는 payload에 담음(kpi_event엔 ws 컬럼 없음).
 *   best-effort — 실패해도 UX 무영향.
 */
export async function logKpi(
  type: 'revisit' | 'consent' | 'ai_quality',
  payload: Record<string, unknown> = {},
): Promise<void> {
  const sb = getSupabase()
  if (!sb) return
  try {
    await sb.from('kpi_event').insert({ type, payload: { ...payload, workspace_id: activeWorkspaceId() } })
  } catch (e) {
    console.error('logKpi', e)
  }
}

/** 北極星(앵커링): 발행 리포트 재방문(revisit) 집계 — 총 횟수 + 다시 열린 리포트 수(활성 ws). */
export async function getAnchoringStats(): Promise<{ revisits: number; anchoredReports: number }> {
  const sb = getSupabase()
  const wsId = activeWorkspaceId()
  if (!sb || !wsId) return { revisits: 0, anchoredReports: 0 }
  try {
    const { data, error } = await sb.from('kpi_event').select('payload').eq('type', 'revisit')
    if (error || !data) return { revisits: 0, anchoredReports: 0 }
    const rows = data as { payload: { zet_id?: string; workspace_id?: string } | null }[]
    const inWs = rows.filter((r) => r.payload?.workspace_id === wsId)
    const ids = new Set(inWs.map((r) => r.payload?.zet_id).filter(Boolean))
    return { revisits: inWs.length, anchoredReports: ids.size }
  } catch (e) {
    console.error('getAnchoringStats', e)
    return { revisits: 0, anchoredReports: 0 }
  }
}

/**
 * §4 보정본(L2) 영속 + 보정추적 로깅. 반환=corrected_id(발행 계보용). best-effort.
 *   objet(L1)은 그대로 두고 별 레이어로 저장 → '리포트는 무조건 L2 기반'을 계보로 추적.
 *   모든 용어 교정·화자 매핑을 correction_log에 누가(owner)·언제(created_at)로 기록.
 */
export async function saveCorrected(input: {
  objetId: string
  correctedBody: string
  speakerMap: SpeakerMap[]
  terms: TermFix[]
}): Promise<string | null> {
  const sb = getSupabase()
  const wsId = activeWorkspaceId()
  if (!sb || !wsId) return null
  const { data, error } = await sb
    .from('corrected_transcript')
    .insert({
      objet_id: input.objetId,
      workspace_id: wsId,
      corrected_body: input.correctedBody,
      speaker_map: input.speakerMap,
      terms: input.terms,
    })
    .select('id')
    .single()
  if (error || !data) {
    console.error('saveCorrected', JSON.stringify(error))
    return null
  }
  const correctedId = (data as { id: string }).id
  // 보정 추적(감사 로그) — 용어/화자 변경 기록. best-effort(실패해도 보정본은 저장됨).
  const logs: Record<string, unknown>[] = [
    ...input.terms.map((t) => ({
      workspace_id: wsId,
      objet_id: input.objetId,
      corrected_id: correctedId,
      kind: 'term',
      from_value: t.from,
      to_value: t.to,
    })),
    ...input.speakerMap.map((s) => ({
      workspace_id: wsId,
      objet_id: input.objetId,
      corrected_id: correctedId,
      kind: 'speaker',
      from_value: s.raw,
      to_value: s.identity ? `${s.role}:${s.identity}` : s.role,
    })),
  ]
  if (logs.length > 0) {
    const { error: logErr } = await sb.from('correction_log').insert(logs)
    if (logErr) console.error('correction_log', JSON.stringify(logErr))
  }
  return correctedId
}

/**
 * §5 화자 정체 강사 확인 → 레지스트리 영속(entity speaker, confirmed=true + alias=raw 라벨).
 *   '사람 확인된 것만 유효'(자동단정 금지)를 닫는 루프 — 다음 보정이 이 레지스트리를 근거로 씀.
 *   동일 정체(canonical)가 이미 있으면 재사용(중복 방지).
 */
export async function confirmSpeaker(input: {
  rawLabel: string
  identity: string
  role: SpeakerMap['role']
}): Promise<boolean> {
  const sb = getSupabase()
  const wsId = activeWorkspaceId()
  const identity = input.identity.trim()
  if (!sb || !wsId || !identity) return false
  let entityId: string
  const found = await sb
    .from('entity')
    .select('id')
    .eq('workspace_id', wsId)
    .eq('kind', 'speaker')
    .eq('canonical', identity)
    .maybeSingle()
  if (found.data?.id) {
    entityId = found.data.id as string
    await sb.from('entity').update({ confirmed: true, note: input.role }).eq('id', entityId)
  } else {
    const ins = await sb
      .from('entity')
      .insert({ kind: 'speaker', canonical: identity, confirmed: true, note: input.role, workspace_id: wsId })
      .select('id')
      .single()
    if (ins.error || !ins.data) {
      console.error('confirmSpeaker', JSON.stringify(ins.error))
      return false
    }
    entityId = (ins.data as { id: string }).id
  }
  // raw diarization 라벨을 별칭으로 등록(중복이면 무시).
  const rawLabel = input.rawLabel.trim()
  if (rawLabel) {
    const dup = await sb
      .from('entity_alias')
      .select('id')
      .eq('entity_id', entityId)
      .eq('alias', rawLabel)
      .maybeSingle()
    if (!dup.data) {
      const { error: aErr } = await sb.from('entity_alias').insert({ entity_id: entityId, alias: rawLabel })
      if (aErr) console.error('confirmSpeaker alias', JSON.stringify(aErr))
    }
  }
  return true
}

// ── 관계 그래프: 리포트↔리포트 타입드 엣지 (클라, getSupabase 직접 + RLS owner) ──
// 노드 = published 리포트, 엣지 = 사람이 UI에서 확정한 타입드 관계(자동 생성 없음).
// 무결성: owner=auth.uid() 자동 스탬핑(클라가 owner 안 보냄), workspace_id=활성 ws.
//   useDB 스냅샷(objet/zet)에는 미편입 — 컴포넌트 로컬 state로 보관·명시적 재조회(기존 동작 보존).

/** 엣지 종류(클라). graph.ts EdgeKind와 동일 union — 클라/서버 경계라 각자 선언. */
export type EdgeKind = 'supersedes' | 'related' | 'contraindication' | 'longitudinal'

/** 클라용 리포트 엣지(상세 "관련 리포트" 섹션·관계 뷰 표시용). */
export type ReportEdge = {
  id: string
  fromZet: string
  toZet: string
  kind: EdgeKind
  note?: string
  createdAt: number
}

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
  kind: r.kind as EdgeKind,
  note: r.note ?? undefined,
  createdAt: new Date(r.created_at).getTime(),
})

/** 특정 리포트에 걸린 엣지 회수(from_zet=zetId OR to_zet=zetId, owner RLS·활성 ws 스코프). */
export async function listReportEdges(zetId: string): Promise<ReportEdge[]> {
  const sb = getSupabase()
  const wsId = activeWorkspaceId()
  if (!sb || !wsId || !zetId) return []
  const { data, error } = await sb
    .from('zet_edge')
    .select('id, from_zet, to_zet, kind, note, created_at')
    .eq('workspace_id', wsId)
    .or(`from_zet.eq.${zetId},to_zet.eq.${zetId}`)
    .order('created_at', { ascending: false })
  if (error) {
    console.error('listReportEdges', JSON.stringify(error))
    return []
  }
  return ((data as EdgeRow[] | null) ?? []).map(toEdge)
}

/** 활성 ws의 전체 엣지 회수(관계 그래프 뷰). owner RLS + ws 스코프. */
export async function listAllEdges(): Promise<ReportEdge[]> {
  const sb = getSupabase()
  const wsId = activeWorkspaceId()
  if (!sb || !wsId) return []
  const { data, error } = await sb
    .from('zet_edge')
    .select('id, from_zet, to_zet, kind, note, created_at')
    .eq('workspace_id', wsId)
    .order('created_at', { ascending: false })
  if (error) {
    console.error('listAllEdges', JSON.stringify(error))
    return []
  }
  return ((data as EdgeRow[] | null) ?? []).map(toEdge)
}

/**
 * 두 published 리포트 연결(사람 확정). owner=auth.uid() 자동, workspace_id=활성 ws.
 * 자기참조·중복(unique)·잘못된 kind는 DB가 거부 → 실패 시 null.
 */
export async function linkReports(
  fromId: string,
  toId: string,
  kind: EdgeKind,
  note?: string,
): Promise<ReportEdge | null> {
  const sb = getSupabase()
  const wsId = activeWorkspaceId()
  if (!sb || !wsId || !fromId || !toId) return null
  const { data, error } = await sb
    .from('zet_edge')
    .insert({
      from_zet: fromId,
      to_zet: toId,
      kind,
      note: note?.trim() ? note.trim() : null,
      workspace_id: wsId,
    })
    .select('id, from_zet, to_zet, kind, note, created_at')
    .single()
  if (error || !data) {
    console.error('linkReports', JSON.stringify(error))
    return null
  }
  return toEdge(data as EdgeRow)
}

/** 엣지 1건 해제(연결 끊기). RLS owner. */
export async function unlinkEdge(id: string): Promise<void> {
  const sb = getSupabase()
  if (!sb || !id) return
  const { error } = await sb.from('zet_edge').delete().eq('id', id)
  if (error) console.error('unlinkEdge', JSON.stringify(error))
}

// ── AI Wiki 클라 배선 (서버 라우트 호출 — 키·복호화·OpenAI는 서버에서만) ──
// 경계 단일 통로: 브라우저 → Authorization: Bearer <supabase access token> → route.ts.
// 키는 절대 클라에 안 닿음; 여기선 세션 토큰만 첨부한다.

/** 세션 access token Bearer 첨부 + 활성 워크스페이스 자동 첨부 후 POST. !ok면 throw. */
async function authedFetch<T>(path: string, body: unknown): Promise<T> {
  const sb = getSupabase()
  if (!sb) throw new Error('Supabase 미설정')
  const { data } = await sb.auth.getSession()
  const token = data.session?.access_token
  if (!token) throw new Error('로그인 필요')
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ ...(body as Record<string, unknown>), workspaceId: activeWorkspaceId() }),
  })
  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`${path} ${res.status}${detail ? `: ${detail}` : ''}`)
  }
  return (await res.json()) as T
}

/** OpenAI 키 저장(BYOK) — POST /api/byok. 서버가 AES-256-GCM 암호화해 보관. */
export async function saveLlmKey(apiKey: string, provider?: string): Promise<boolean> {
  const r = await authedFetch<{ ok?: boolean }>('/api/byok', { apiKey, provider })
  return Boolean(r.ok)
}

/** 키 설정 여부만 확인 — GET /api/byok(키·복호화 반환 없음). */
export async function getLlmConfigured(): Promise<boolean> {
  const sb = getSupabase()
  if (!sb) return false
  const { data } = await sb.auth.getSession()
  const token = data.session?.access_token
  if (!token) return false
  try {
    const res = await fetch('/api/byok', { method: 'GET', headers: { Authorization: `Bearer ${token}` } })
    if (!res.ok) return false
    const j = (await res.json()) as { configured?: boolean }
    return Boolean(j.configured)
  } catch (e) {
    console.error('getLlmConfigured', e)
    return false
  }
}

/** 길B(대화발) RAG 질의 — POST /api/chat. 답변 + 근거 출처 반환. */
export async function chatAsk(
  message: string,
  history?: { role: 'user' | 'assistant'; content: string }[],
): Promise<{ answer: string; sources: RagSource[] }> {
  return authedFetch<{ answer: string; sources: RagSource[] }>('/api/chat', { message, history })
}

/** 원본/발행 zet 임베딩 — POST /api/embed. 청크 수 반환. */
export async function embedSource(sourceType: 'objet' | 'zet', sourceId: string): Promise<number> {
  const r = await authedFetch<{ count: number }>('/api/embed', { sourceType, sourceId })
  return r.count
}

/** 길A 보정(L2) — POST /api/correct. 보정본 + 화자 매핑(제안) + 용어 교정. */
export async function correctObjet(
  objetId: string,
): Promise<{ corrected: string; speakerMap: SpeakerMap[]; terms: TermFix[] }> {
  return authedFetch<{ corrected: string; speakerMap: SpeakerMap[]; terms: TermFix[] }>('/api/correct', {
    objetId,
  })
}

/** 길A 초점 추출(L3) — POST /api/extract. 근거 스팬 있는 조각만. */
export async function extractFocuses(input: {
  objetId?: string
  correctedText?: string
}): Promise<{ focuses: Focus[] }> {
  return authedFetch<{ focuses: Focus[] }>('/api/extract', input)
}

// ── BYO 데이터 분리(알파): 고객 Supabase 연결 (클라 ↔ /api/customer-db) ──
// 2-티어: 인증·계정·기본딕셔너리·BYOK 키는 중앙 momso-alpha, 데이터(objet/zet/embedding/
//   zet_link/zet_edge/entity)는 연결 시 고객 자기 Supabase. service 키는 절대 브라우저에 안 닿음 —
//   여기선 세션 토큰만 첨부하고, 암호화·복호화·고객 접근은 전부 서버 라우트(runtime nodejs)에서만.
//
// 라우팅 골격(후속 슬라이스 전환 지점): 이 슬라이스 확정 범위는 (1) 연결 저장·상태·해제 동작,
//   (2) 서버가 고객 DB에 붙는 기반(customerdb.ts), (3) dataClient() 분기 자리.
//   objet/zet/zet_edge/entity 각 op의 app/api/data/* 프록시 전환은 분리하되, 그때까지 데이터는
//   현행 getSupabase() 직결(=중앙 momso-alpha 폴백)로 안전 동작(현 동작 100% 보존).

/** 세션 access token Bearer를 단 fetch(POST 외 메서드용). 미로그인이면 null. */
async function authedRequest(path: string, init: RequestInit): Promise<Response | null> {
  const sb = getSupabase()
  if (!sb) return null
  const { data } = await sb.auth.getSession()
  const token = data.session?.access_token
  if (!token) return null
  return fetch(path, {
    ...init,
    headers: { ...(init.headers ?? {}), Authorization: `Bearer ${token}` },
  })
}

/** 고객 Supabase 연결 상태(클라) — GET /api/customer-db. 키·암호문은 반환되지 않음(불리언·마스킹 URL만). */
export async function getCustomerDbStatus(): Promise<{
  connected: boolean
  provisioned: boolean
  urlMasked: string | null
}> {
  const fallback = { connected: false, provisioned: false, urlMasked: null }
  try {
    const res = await authedRequest('/api/customer-db', { method: 'GET' })
    if (!res || !res.ok) return fallback
    const j = (await res.json()) as { connected?: boolean; provisioned?: boolean; urlMasked?: string | null }
    return {
      connected: Boolean(j.connected),
      provisioned: Boolean(j.provisioned),
      urlMasked: j.urlMasked ?? null,
    }
  } catch (e) {
    console.error('getCustomerDbStatus', e)
    return fallback
  }
}

/** 고객 Supabase 연결 저장(클라) — POST /api/customer-db {url, anonKey, serviceKey}. 키는 서버로만 전송. */
export async function connectCustomerDb(input: {
  url: string
  anonKey: string
  serviceKey: string
}): Promise<{ ok: boolean; provisioned: boolean; reason?: string }> {
  try {
    const res = await authedRequest('/api/customer-db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
    if (!res) return { ok: false, provisioned: false, reason: 'unauthorized' }
    const j = (await res.json().catch(() => ({}))) as {
      ok?: boolean
      provisioned?: boolean
      reason?: string
      error?: string
    }
    if (!res.ok || !j.ok) {
      return { ok: false, provisioned: false, reason: j.reason ?? j.error }
    }
    return { ok: true, provisioned: Boolean(j.provisioned), reason: j.reason }
  } catch (e) {
    console.error('connectCustomerDb', e)
    return { ok: false, provisioned: false, reason: 'request_failed' }
  }
}

/** 고객 Supabase 연결 해제(클라) — DELETE /api/customer-db. 이후 데이터 op은 중앙 폴백. */
export async function disconnectCustomerDb(): Promise<boolean> {
  try {
    const res = await authedRequest('/api/customer-db', { method: 'DELETE' })
    if (!res || !res.ok) return false
    const j = (await res.json().catch(() => ({}))) as { ok?: boolean }
    return Boolean(j.ok)
  } catch (e) {
    console.error('disconnectCustomerDb', e)
    return false
  }
}

// ── 데이터 라우팅 분기 지점(라우팅 골격) ──────────────────────────────
// 알파 이 슬라이스의 확정 범위: 연결 저장/상태/해제 + 폴백. objet/zet/zet_edge/entity 각 op의
// app/api/data/[table] 프록시 전환은 *후속 슬라이스*로 분리한다(store 전면 프록시화는 한 슬라이스로 무리).
//
// 정직한 폴백 규칙(잠긴 아키텍처 §3 — 현 동작 100% 보존):
//   - 미연결(customer_db 행 없음)                  → 중앙 getSupabase() 직결.
//   - 연결됐으나 provisioned=false(스키마 미적용)     → 여전히 중앙 폴백(빈 고객 DB로 라우팅해 0행/유실 방지).
//   - provisioned=true                            → (후속) app/api/data/[table] 프록시로 고객 DB.
// 지금은 어떤 경우에도 중앙 직결을 반환해 현행 동작을 깨지 않는다. provisioned=true에서
// 프록시로 전환하는 지점만 이 함수에 표식으로 남긴다(후속 슬라이스가 여기만 갈아끼우면 됨).

/**
 * 데이터 op(objet/zet/zet_edge/entity 읽기·쓰기) 클라 선택의 단일 분기점.
 * 알파: 항상 중앙 직결(getSupabase, =폴백). 후속 슬라이스에서 provisioned=true일 때
 *   app/api/data/[table] 프록시로 전환한다(잠긴 아키텍처 §1·§3). 현 store.ts 각 op은
 *   여전히 getSupabase()를 직접 쓰며, 이 함수는 그 전환 지점을 명시·예약한다(동작 동일).
 */
export function dataClient(): ReturnType<typeof getSupabase> {
  // NOTE(후속 슬라이스): getCustomerDbStatus().provisioned === true 일 때
  //   app/api/data/[table] 서버 프록시로 라우팅. 그 전엔 중앙 폴백이 안전 기본값.
  return getSupabase()
}