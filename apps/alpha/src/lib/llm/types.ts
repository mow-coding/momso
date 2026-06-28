// LLM 프로바이더 계약 — 프로바이더-무관 인터페이스 + 공용 타입.
// 순수 타입 모듈(외부 import 없음). 알파는 OpenAI(BYOK)로 구현하되 길A/길B는
// 이 인터페이스에만 의존 → KURE/BGE-m3 등 임베딩 스왑·생성 프로바이더 교체가 자유롭다.
// 서버 전용 의존이 없으므로 server-only 지시문 불필요(구현체 openai.ts/index.ts가 강제).

export type ChatMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export type ChatOpts = {
  model?: string
  messages: ChatMessage[]
  temperature?: number
  // 'json' → 구조화 응답 강제(extract/correct), 'text' → 자유 응답(chat). 미지정 시 'text'.
  responseFormat?: 'text' | 'json'
}

export type EmbedOpts = {
  model?: string
  // 출력 차원. 알파 기본 1024(EMBED_DIM). 스왑 대비 호출부에서 지정 가능.
  dimensions?: number
}

export interface LlmProvider {
  chat(opts: ChatOpts): Promise<{ text: string }>
  embed(texts: string[], opts?: EmbedOpts): Promise<number[][]>
}
