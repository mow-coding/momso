// momso AI Wiki — 길B(대화발) RAG chat 라우트.
// POST {message, history?, workspaceId} → 인증(Bearer) → BYOK 키 복호화 →
//   RAG buildContext(위키+원본 근거) → provider.chat(무결성 system + context + history + message)
//   → {answer, sources}. 빈 위키여도 동작(정직히 "근거 없음").
// 보안/무결성: 키는 서버에서만 복호화(브라우저에 절대 미노출). AI는 근거가 뒷받침하는 것만 단정,
//   출처 항상 첨부, 화자(회원/강사) 보존, 모르면 "불명". service_role 미사용(RLS=유저).

import { routeClient, loadDecryptedKey } from '@/lib/supabase/route'
import { getProvider } from '@/lib/llm/index'
import type { ChatMessage } from '@/lib/llm/types'
import { buildContext, type RagSource } from '@/lib/rag'

export const runtime = 'nodejs'

// 길B는 RAG 상위 k개 근거로 답변. 8개 — context 과대(토큰)·과소(누락) 사이.
const RAG_K = 8

// 제품 #1 불변식: 추론은 틀려도 귀속·인용은 절대 안 틀린다.
const INTEGRITY_SYSTEM = `당신은 요가 강사를 돕는 한국어 AI 위키 어시스턴트 "몸이"입니다. 다음 무결성 원칙을 절대 위반하지 마세요.

- 아래 [근거]에 실제로 있는 내용만 단정합니다. 추론은 틀릴 수 있어도 귀속·인용은 절대 틀리지 않습니다.
- 모든 주장에는 출처를 첨부합니다. 근거가 없으면 그 주장 자체를 하지 않습니다.
- 화자 매핑을 보존합니다: 회원과 강사를 구분하고, 누가 한 말인지 확실치 않으면 "불명"이라고 합니다.
- 패러프레이즈를 사실로 단정하지 않습니다. [근거]에 없는 내용은 만들어내지 않습니다.
- [근거]가 비어 있으면, 위키에 관련 근거가 없다고 정직하게 답합니다(없는 내용을 지어내지 않습니다).
- 답변에는 실제로 사용한 근거만 인용합니다.
- 각 주장 끝에 사용한 근거의 번호를 [N] 형식으로 표기합니다(예: [1], [2]). [근거] 목록에 있는 번호만 쓰고, 없는 번호는 절대 만들지 않습니다. 근거 없이 하는 말에는 번호를 달지 않습니다.`

type ChatBody = {
  message?: unknown
  history?: unknown
  workspaceId?: unknown
}

type HistoryTurn = { role: 'user' | 'assistant'; content: string }

/** history 입력 정화 — user/assistant 턴 + 문자열 content만 허용(system 주입 차단). */
function sanitizeHistory(raw: unknown): HistoryTurn[] {
  if (!Array.isArray(raw)) return []
  const out: HistoryTurn[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const role = (item as { role?: unknown }).role
    const content = (item as { content?: unknown }).content
    if ((role === 'user' || role === 'assistant') && typeof content === 'string' && content.trim()) {
      out.push({ role, content })
    }
  }
  return out
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

export async function POST(req: Request): Promise<Response> {
  // ── 1) 입력 파싱/검증 ───────────────────────────────────────
  let body: ChatBody
  try {
    body = (await req.json()) as ChatBody
  } catch {
    return json({ error: 'invalid_json' }, 400)
  }

  const message = typeof body.message === 'string' ? body.message.trim() : ''
  const workspaceId = typeof body.workspaceId === 'string' ? body.workspaceId : ''
  const history = sanitizeHistory(body.history)

  if (!message) return json({ error: 'message_required' }, 400)
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
    console.error('chat loadDecryptedKey', e)
    return json({ error: 'key_error' }, 500)
  }

  const provider = getProvider('openai', apiKey)

  // ── 4) RAG context 구성(워크스페이스 스코프 KNN) ────────────
  let context = ''
  let sources: RagSource[] = []
  try {
    const rag = await buildContext(ctx.sb, provider, workspaceId, message, RAG_K)
    context = rag.context
    sources = rag.sources
  } catch (e) {
    console.error('chat buildContext', e)
    return json({ error: 'rag_failed' }, 502)
  }

  // ── 5) 생성(무결성 system + 직렬화 근거 + history + 질문) ────
  const contextMsg: ChatMessage = {
    role: 'system',
    content: context
      ? `[근거]\n${context}`
      : '[근거]\n(이 워크스페이스에서 관련 근거를 찾지 못했습니다. 근거가 없다고 정직하게 답하세요.)',
  }

  const messages: ChatMessage[] = [
    { role: 'system', content: INTEGRITY_SYSTEM },
    contextMsg,
    ...history.map((h): ChatMessage => ({ role: h.role, content: h.content })),
    { role: 'user', content: message },
  ]

  let answer: string
  try {
    const res = await provider.chat({ messages, temperature: 0.2 })
    answer = res.text
  } catch (e) {
    console.error('chat provider.chat', e)
    return json({ error: 'llm_failed' }, 502)
  }

  // ── 5.5) 인용 사후가드(§3·§7): 답변의 [N] 인용이 실제 회수 근거(sources) 범위 내인지 검증.
  //   범위 밖(환각) 번호는 제거 — 모델이 없는 근거를 인용한 흔적을 사람에게 보이지 않게.
  const maxRef = sources.length
  let flaggedCitations = 0
  answer = answer
    .replace(/\[(\d+)\]/g, (m, n) => {
      const idx = Number(n)
      if (idx >= 1 && idx <= maxRef) return m
      flaggedCitations++
      return ''
    })
    .replace(/ {2,}/g, ' ')

  // ── 6) 답변 + 회수한 근거 + 사후가드 결과 반환 ─
  return json({ answer, sources, flaggedCitations }, 200)
}