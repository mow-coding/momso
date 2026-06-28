import 'server-only'

import { getProvider, DEFAULT_CHAT_MODEL } from '@/lib/llm'
import { loadDecryptedKey, routeClient } from '@/lib/supabase/route'

// 길A L3 — AI 초점 추출: 보정본(또는 원본 전사) → 대화 초점 조각.
// 각 조각은 {text, speakerRole, sourceSpan}. 근거(sourceSpan) 없는 조각은 응답에서 제외(무결성 #1).
// 결과는 검수 화면(ReviewView)에서 회원/강사/제외/불명 칩으로 사람이 확정한 뒤에만 발행된다.
// 복호화·OpenAI 호출은 오직 이 서버 라우트(runtime nodejs)에서. 브라우저엔 키가 닿지 않는다.
export const runtime = 'nodejs'

type ExtractBody = { objetId?: unknown; correctedText?: unknown; workspaceId?: unknown }

type SpeakerRole = 'member' | 'teacher' | 'excluded' | 'unknown'

type Focus = { text: string; speakerRole: SpeakerRole; sourceSpan: string }

const ROLES: readonly SpeakerRole[] = ['member', 'teacher', 'excluded', 'unknown']

// 무결성 시스템 프롬프트(제품 #1 불변식). 추론은 틀려도 귀속·인용은 절대 안 틀린다.
const INTEGRITY_SYSTEM = [
  '당신은 요가 수업 전사·보정본에서 "대화 초점"을 추출하는 도우미입니다. 한국어로 작업합니다.',
  '무결성 원칙(반드시 지킬 것):',
  '- 본문(보정본/전사본)이 직접 뒷받침하는 내용만 단정합니다. 본문에 없는 내용은 절대 생성하지 않습니다.',
  '- 모든 초점 조각에는 본문에서 그대로 인용한 근거 스팬(sourceSpan)을 반드시 첨부합니다. 근거가 없으면 그 조각 자체를 만들지 않습니다.',
  '- 화자 매핑을 보존합니다: 회원(member)과 강사(teacher)를 구분하고, 정체가 불확실하면 unknown으로 둡니다. 인사·잡담·수업과 무관한 발화는 excluded.',
  '- 패러프레이즈를 사실로 단정하지 않습니다. 모르면 unknown입니다. diarization(화자 A/B)과 정체(누구인지)는 다릅니다 — 확신 없으면 unknown.',
  '출력은 아래 JSON 스키마만 반환합니다(설명·코드펜스 없이 순수 JSON):',
  '{ "focuses": [ { "text": string, "speakerRole": "member" | "teacher" | "excluded" | "unknown", "sourceSpan": string } ] }',
  '- text: 초점 조각을 간결한 한국어 한 문장으로.',
  '- sourceSpan: 본문에서 그대로 발췌한, 그 초점을 뒷받침하는 짧은 인용(반드시 본문에 존재해야 함).',
  '- 적절한 초점이 없으면 { "focuses": [] }.',
].join('\n')

/** 모델 응답에서 JSON 객체를 견고하게 파싱(코드펜스/잡텍스트 허용). 실패 시 null. */
function parseJsonObject(raw: string): Record<string, unknown> | null {
  const trimmed = raw.trim()
  const candidates: string[] = [trimmed]

  // ```json ... ``` 펜스 제거 후보
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fence?.[1]) candidates.push(fence[1].trim())

  // 첫 { ~ 마지막 } 슬라이스 후보
  const first = trimmed.indexOf('{')
  const last = trimmed.lastIndexOf('}')
  if (first !== -1 && last > first) candidates.push(trimmed.slice(first, last + 1))

  for (const c of candidates) {
    try {
      const v = JSON.parse(c)
      if (v && typeof v === 'object' && !Array.isArray(v)) return v as Record<string, unknown>
    } catch {
      // 다음 후보 시도
    }
  }
  return null
}

/** 공백 정규화(스팬 대조용) — 연속 공백/개행을 단일 공백으로 접어 견고하게 비교. */
function normSpan(s: string): string {
  return s.replace(/\s+/g, ' ').trim()
}

/**
 * 모델이 준 focuses를 무결성 규칙으로 정규화 + 서버 검증 패스(§3):
 *   ① 근거 스팬 없는/빈 조각 제외, ② **인용 스팬이 본문(sourceText)에 실제로 존재하는지 기계 검증** —
 *   LLM이 출처를 지어내거나 요약·재서술하면(본문에 없으면) 그 조각을 버린다. '인용=원본 스팬 고정' 강제.
 */
function normalizeFocuses(value: unknown, sourceText: string): { focuses: Focus[]; dropped: number } {
  if (!Array.isArray(value)) return { focuses: [], dropped: 0 }
  const haystack = normSpan(sourceText)
  const out: Focus[] = []
  let dropped = 0
  for (const item of value) {
    if (!item || typeof item !== 'object') continue
    const rec = item as Record<string, unknown>
    const text = typeof rec.text === 'string' ? rec.text.trim() : ''
    const sourceSpan = typeof rec.sourceSpan === 'string' ? rec.sourceSpan.trim() : ''
    if (!text || !sourceSpan) {
      dropped++
      continue
    }
    // 무결성 #1: 스팬이 본문에 실재해야만 통과(환각·요약 인용 차단). 서버가 자기보고를 안 믿는다.
    if (!haystack.includes(normSpan(sourceSpan))) {
      dropped++
      continue
    }
    const rawRole = typeof rec.speakerRole === 'string' ? rec.speakerRole.trim() : ''
    const speakerRole: SpeakerRole = (ROLES as readonly string[]).includes(rawRole)
      ? (rawRole as SpeakerRole)
      : 'unknown'
    out.push({ text, speakerRole, sourceSpan })
  }
  return { focuses: out, dropped }
}

/** POST: 보정본/원본 전사 → 초점 조각 추출. 응답 { focuses }. */
export async function POST(req: Request): Promise<Response> {
  let ctx
  try {
    ctx = await routeClient(req)
  } catch {
    return Response.json({ error: 'unauthorized' }, { status: 401 })
  }

  let body: ExtractBody
  try {
    body = (await req.json()) as ExtractBody
  } catch {
    return Response.json({ error: 'invalid_json' }, { status: 400 })
  }

  const objetId = typeof body.objetId === 'string' && body.objetId.trim() ? body.objetId.trim() : ''
  const correctedText =
    typeof body.correctedText === 'string' && body.correctedText.trim() ? body.correctedText.trim() : ''
  const workspaceId = typeof body.workspaceId === 'string' ? body.workspaceId.trim() : ''

  if (!objetId && !correctedText) {
    return Response.json({ error: 'missing_source' }, { status: 400 })
  }

  // 추출 대상 텍스트 확보: correctedText 우선, 없으면 objet.body(RLS=owner + 워크스페이스 스코프) 로드.
  let sourceText = correctedText
  if (!sourceText) {
    let q = ctx.sb.from('objet').select('body').eq('id', objetId)
    if (workspaceId) q = q.eq('workspace_id', workspaceId)
    const { data, error } = await q.maybeSingle()
    if (error) {
      return Response.json({ error: 'source_load_failed' }, { status: 500 })
    }
    if (!data) {
      return Response.json({ error: 'source_not_found' }, { status: 404 })
    }
    sourceText = typeof data.body === 'string' ? data.body.trim() : ''
  }

  if (!sourceText) {
    // 근거 본문이 비면 정직하게 빈 초점 반환(가짜 초점 생성 금지).
    return Response.json({ focuses: [] })
  }

  // BYOK 키 복호화 — OpenAI 호출 직전에만.
  let apiKey: string
  try {
    apiKey = await loadDecryptedKey(ctx)
  } catch (e) {
    const msg = e instanceof Error ? e.message : ''
    if (msg === 'NO_KEY') {
      return Response.json({ error: 'no_key' }, { status: 400 })
    }
    return Response.json({ error: 'key_unavailable' }, { status: 500 })
  }

  let provider
  try {
    provider = getProvider('openai', apiKey)
  } catch {
    return Response.json({ error: 'provider_unavailable' }, { status: 500 })
  }

  const userPrompt = [
    '다음 본문에서 대화 초점 조각을 추출하세요. 본문에 없는 내용은 만들지 말고, 각 조각마다 본문 인용(sourceSpan)을 반드시 붙이세요.',
    '',
    '──── 본문 시작 ────',
    sourceText,
    '──── 본문 끝 ────',
  ].join('\n')

  let result
  try {
    result = await provider.chat({
      model: DEFAULT_CHAT_MODEL,
      temperature: 0,
      responseFormat: 'json',
      messages: [
        { role: 'system', content: INTEGRITY_SYSTEM },
        { role: 'user', content: userPrompt },
      ],
    })
  } catch {
    return Response.json({ error: 'llm_failed' }, { status: 502 })
  }

  const parsed = parseJsonObject(result.text)
  if (!parsed) {
    return Response.json({ error: 'llm_bad_output' }, { status: 502 })
  }

  const { focuses, dropped } = normalizeFocuses(parsed.focuses, sourceText)
  // 검증 패스 가시화: 본문에 실재하지 않아 버려진 인용 수를 함께 보고(무결성 #1).
  return Response.json({ focuses, droppedUnverified: dropped })
}