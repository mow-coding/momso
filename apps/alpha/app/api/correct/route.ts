// momso AI Wiki — 길A(수업발) 보정(L2) correct 라우트.
// POST {objetId, workspaceId} → 인증(Bearer) → BYOK 키 복호화 →
//   objet.body(전사본) + 워크스페이스 몸소 딕셔너리(entity speaker/term + alias) 로드 →
//   provider.chat(무결성 + 용어교정 + 화자정체 매핑 지시, JSON 강제)
//   → {corrected, speakerMap[], terms[]}.
// 무결성/보안: 키는 서버에서만 복호화(브라우저 미노출, service_role 미사용=RLS 유저). 보정본은
//   DB에 새 row를 만들지 않고 검수 화면 상태로만 반환(born-correction은 검수 후 zet로 영속).
//   화자 정체는 "제안"이며 확신 없으면 role='unknown'. 원문에 없는 화자/용어를 지어내지 않음.

import { routeClient, loadDecryptedKey } from '@/lib/supabase/route'
import { getProvider } from '@/lib/llm/index'
import type { ChatMessage } from '@/lib/llm/types'

export const runtime = 'nodejs'

// 제품 #1 불변식: 추론은 틀려도 귀속·인용은 절대 안 틀린다.
const INTEGRITY_SYSTEM = `당신은 요가 강사를 돕는 한국어 AI 위키의 보정 도우미 "몸이"입니다. 수업 전사본을 보정합니다. 다음 무결성 원칙을 절대 위반하지 마세요.

- 전사본에 실제로 있는 내용만 다룹니다. 추론은 틀릴 수 있어도 귀속·인용은 절대 틀리지 않습니다.
- 화자 매핑은 "제안"입니다. diarization(A/B 같은 화자 구분)과 정체(그 화자가 누구인가)는 다릅니다. 누가 회원이고 누가 강사인지 확실치 않으면 role을 "unknown"으로 두고, 정체(identity)도 확실치 않으면 비워 둡니다.
- 용어 교정은 [몸소 딕셔너리]에 근거가 있을 때만 합니다. 딕셔너리에 없는 용어를 임의로 바꾸거나 만들어내지 않습니다.
- 보정은 표기·오탈자·전사 오류·용어 정정에 한정합니다. 전사본에 없는 문장·내용을 추가하거나 의미를 바꾸지 않습니다.
- 모르면 "불명"으로 둡니다. 확신을 지어내지 않습니다.`

type CorrectBody = {
  objetId?: unknown
  workspaceId?: unknown
}

// objet 본문 + 종류(전사본 여부 안내용)만 로드.
type ObjetRow = { id: string; kind: string; title: string; body: string | null; workspace_id: string }

// 몸소 딕셔너리: entity(kind speaker/term, canonical) + alias.
type EntityRow = {
  id: string
  kind: 'speaker' | 'term'
  canonical: string
  note: string | null
  entity_alias: { alias: string }[] | null
}

// 클라(store.ts SpeakerMap/TermFix)가 import하는 응답 형태와 동일.
type SpeakerMap = { raw: string; role: 'member' | 'teacher' | 'unknown'; identity?: string }
type TermFix = { from: string; to: string }

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

/** LLM JSON 응답에서 코드펜스/잡텍스트를 제거하고 가장 바깥 객체만 파싱. 실패 시 null. */
function parseJsonObject(raw: string): Record<string, unknown> | null {
  let s = raw.trim()
  // ```json … ``` 펜스 제거(혹시 모델이 감쌀 경우).
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)
  if (fence) s = fence[1].trim()
  // 첫 { … 마지막 } 사이만 취해 안전 파싱.
  const start = s.indexOf('{')
  const end = s.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) return null
  try {
    const parsed = JSON.parse(s.slice(start, end + 1))
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null
  } catch {
    return null
  }
}

/** speakerMap 정화 — raw 필수, role은 허용 3값만(그 외 unknown), identity는 비면 생략. */
function sanitizeSpeakerMap(raw: unknown): SpeakerMap[] {
  if (!Array.isArray(raw)) return []
  const out: SpeakerMap[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const rawLabel = (item as { raw?: unknown }).raw
    if (typeof rawLabel !== 'string' || !rawLabel.trim()) continue
    const roleVal = (item as { role?: unknown }).role
    const role: SpeakerMap['role'] =
      roleVal === 'member' || roleVal === 'teacher' ? roleVal : 'unknown'
    const idVal = (item as { identity?: unknown }).identity
    const identity = typeof idVal === 'string' && idVal.trim() ? idVal.trim() : undefined
    const entry: SpeakerMap = { raw: rawLabel.trim(), role }
    if (identity) entry.identity = identity
    out.push(entry)
  }
  return out
}

/** terms 정화 — from/to 둘 다 비어있지 않은 문자열만. 동일 교정 제거. */
function sanitizeTerms(raw: unknown): TermFix[] {
  if (!Array.isArray(raw)) return []
  const out: TermFix[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const from = (item as { from?: unknown }).from
    const to = (item as { to?: unknown }).to
    if (typeof from !== 'string' || typeof to !== 'string') continue
    const f = from.trim()
    const t = to.trim()
    if (!f || !t || f === t) continue
    out.push({ from: f, to: t })
  }
  return out
}

/** entity 행들을 프롬프트용 딕셔너리 텍스트로 직렬화. 빈 경우 안내 문구. */
function serializeDictionary(entities: EntityRow[]): string {
  const speakers = entities.filter((e) => e.kind === 'speaker')
  const terms = entities.filter((e) => e.kind === 'term')
  const lines: string[] = []

  const aliasText = (e: EntityRow) => {
    const a = (e.entity_alias ?? []).map((x) => x.alias).filter(Boolean)
    return a.length ? ` (별칭: ${a.join(', ')})` : ''
  }

  if (speakers.length) {
    lines.push('[화자]')
    for (const e of speakers) lines.push(`- ${e.canonical}${aliasText(e)}${e.note ? ` — ${e.note}` : ''}`)
  }
  if (terms.length) {
    lines.push('[용어]')
    for (const e of terms) lines.push(`- ${e.canonical}${aliasText(e)}${e.note ? ` — ${e.note}` : ''}`)
  }
  return lines.length ? lines.join('\n') : '(이 워크스페이스에 등록된 딕셔너리 항목이 없습니다.)'
}

export async function POST(req: Request): Promise<Response> {
  // ── 1) 입력 파싱/검증 ───────────────────────────────────────
  let body: CorrectBody
  try {
    body = (await req.json()) as CorrectBody
  } catch {
    return json({ error: 'invalid_json' }, 400)
  }

  const objetId = typeof body.objetId === 'string' ? body.objetId.trim() : ''
  const workspaceId = typeof body.workspaceId === 'string' ? body.workspaceId : ''

  if (!objetId) return json({ error: 'objet_required' }, 400)
  if (!workspaceId) return json({ error: 'workspace_required' }, 400)

  // ── 2) 인증(Bearer → RLS 스코프 클라) ───────────────────────
  let ctx
  try {
    ctx = await routeClient(req)
  } catch {
    return json({ error: 'unauthorized' }, 401)
  }

  // ── 3) BYOK 키 복호화(서버에서만, 호출 직전) ────────────────
  let apiKey: string
  try {
    apiKey = await loadDecryptedKey(ctx)
  } catch (e) {
    if (e instanceof Error && e.message === 'NO_KEY') {
      return json({ error: 'no_key' }, 409)
    }
    console.error('correct loadDecryptedKey', e)
    return json({ error: 'key_error' }, 500)
  }

  // ── 4) 전사본(objet) 로드 — RLS=owner + 워크스페이스 스코프 ──
  let objet: ObjetRow
  try {
    const { data, error } = await ctx.sb
      .from('objet')
      .select('id, kind, title, body, workspace_id')
      .eq('id', objetId)
      .eq('workspace_id', workspaceId)
      .maybeSingle()
    if (error) {
      console.error('correct objet load', JSON.stringify(error))
      return json({ error: 'objet_load_failed' }, 500)
    }
    if (!data) return json({ error: 'objet_not_found' }, 404)
    objet = data as ObjetRow
  } catch (e) {
    console.error('correct objet load', e)
    return json({ error: 'objet_load_failed' }, 500)
  }

  const transcript = (objet.body ?? '').trim()
  if (!transcript) return json({ error: 'empty_transcript' }, 422)

  // ── 5) 몸소 딕셔너리(entity speaker/term + alias) 로드 ───────
  //    실패해도 보정은 진행(딕셔너리 없이도 표기·오탈자 보정 가능) — best-effort.
  let entities: EntityRow[] = []
  try {
    const { data, error } = await ctx.sb
      .from('entity')
      .select('id, kind, canonical, note, entity_alias ( alias )')
      .eq('workspace_id', workspaceId)
      .in('kind', ['speaker', 'term'])
    if (error) {
      console.error('correct entity load', JSON.stringify(error))
    } else if (Array.isArray(data)) {
      entities = data as unknown as EntityRow[]
    }
  } catch (e) {
    console.error('correct entity load', e)
  }

  // 기본 제공 딕셔너리(dictionary_term, scope='base') — momso 표준 용어 표기 근거(best-effort)
  let baseTerms: { term: string; reading: string | null; note: string | null }[] = []
  try {
    const { data, error } = await ctx.sb
      .from('dictionary_term')
      .select('term, reading, note')
      .eq('scope', 'base')
    if (error) console.error('correct base dict load', JSON.stringify(error))
    else if (Array.isArray(data)) baseTerms = data as typeof baseTerms
  } catch (e) {
    console.error('correct base dict load', e)
  }
  const baseDictText = baseTerms.length
    ? baseTerms.map((t) => `- ${t.reading ?? t.term} (${t.term})${t.note ? ' — ' + t.note : ''}`).join('\n')
    : ''
  const dictionary = [
    baseDictText && '## 기본 요가 용어(momso 표준 표기)\n' + baseDictText,
    '## 이 워크스페이스 딕셔너리\n' + serializeDictionary(entities),
  ]
    .filter(Boolean)
    .join('\n\n')

  // ── 6) 생성(무결성 + 용어교정 + 화자정체 매핑, JSON 강제) ────
  // born-digital(음성무관 문서: 철학·교재·운영)은 diarization이 없음 → 화자 매핑 생략, 용어 정규화만
  //   (§4: 화자 없는 문서에 무의미한 화자 추정 유발 방지).
  const isTranscript = objet.kind.startsWith('class_')
  const instruction = isTranscript
    ? `다음 수업 전사본을 보정하세요.

[몸소 딕셔너리]
${dictionary}

[전사본]
${transcript}

작업:
1) 표기/오탈자/전사 오류를 바로잡고, [몸소 딕셔너리]에 근거가 있는 용어를 정정한 "보정본"을 만듭니다. 전사본에 없는 내용은 추가하지 않습니다.
2) 전사본에 등장하는 화자 라벨(예: "A", "화자1", "선생님" 등)을 식별해, 각 화자가 회원(member)인지 강사(teacher)인지 매핑을 "제안"합니다. 확실치 않으면 role을 "unknown"으로, 정체(identity)도 확실치 않으면 생략합니다.
3) 실제로 적용한 용어 교정 목록을 from→to로 보고합니다(딕셔너리 근거가 있는 것만).

반드시 아래 JSON 형식만 출력하세요(다른 텍스트 금지):
{
  "corrected": "보정본 전체 텍스트",
  "speakerMap": [{ "raw": "전사본의 화자 라벨", "role": "member" | "teacher" | "unknown", "identity": "정체(선택, 확신 없으면 생략)" }],
  "terms": [{ "from": "원래 표기", "to": "교정 표기" }]
}`
    : `다음 문서를 보정하세요. 이 문서는 음성 전사가 아니라 born-digital 문서(철학·교재·운영 등)이며 화자 구분이 없습니다 — 화자 매핑은 하지 않습니다.

[몸소 딕셔너리]
${dictionary}

[문서]
${transcript}

작업:
1) 표기/오탈자 오류를 바로잡고, [몸소 딕셔너리]에 근거가 있는 용어를 정정한 "보정본"을 만듭니다. 원문에 없는 내용은 추가하지 않습니다.
2) 실제로 적용한 용어 교정 목록을 from→to로 보고합니다(딕셔너리 근거가 있는 것만).

반드시 아래 JSON 형식만 출력하세요(다른 텍스트 금지):
{
  "corrected": "보정본 전체 텍스트",
  "terms": [{ "from": "원래 표기", "to": "교정 표기" }]
}`

  const messages: ChatMessage[] = [
    { role: 'system', content: INTEGRITY_SYSTEM },
    { role: 'user', content: instruction },
  ]

  const provider = getProvider('openai', apiKey)

  let text: string
  try {
    const res = await provider.chat({ messages, temperature: 0, responseFormat: 'json' })
    text = res.text
  } catch (e) {
    console.error('correct provider.chat', e)
    return json({ error: 'llm_failed' }, 502)
  }

  // ── 7) JSON 파싱/정화 — 깨지면 정직하게 실패(가짜 보정본 금지) ─
  const parsed = parseJsonObject(text)
  if (!parsed) {
    console.error('correct parse failed', text.slice(0, 300))
    return json({ error: 'parse_failed' }, 502)
  }

  const corrected = typeof parsed.corrected === 'string' && parsed.corrected.trim() ? parsed.corrected : transcript
  // born-digital은 화자 매핑 자체를 만들지 않음(빈 배열) — 무의미한 화자 추정 차단.
  const speakerMap = isTranscript ? sanitizeSpeakerMap(parsed.speakerMap) : []
  const terms = sanitizeTerms(parsed.terms)

  return json({ corrected, speakerMap, terms }, 200)
}