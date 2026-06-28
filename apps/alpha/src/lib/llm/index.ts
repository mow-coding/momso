import 'server-only'

import { createOpenAiProvider } from './openai'
import type { LlmProvider } from './types'

/** 기본 생성 모델. 상수 교체만으로 스왑 가능(프로바이더-무관 설계). */
export const DEFAULT_CHAT_MODEL = 'gpt-4o-mini'

/** 임베딩 모델. KURE/BGE-m3 등 한국어 모델 스왑 대비. */
export const EMBED_MODEL = 'text-embedding-3-small'

/** 임베딩 차원. text-embedding-3-small을 1024로 축소(스키마 vector(1024)와 일치, KURE 스왑 시 무변경). */
export const EMBED_DIM = 1024

/**
 * 프로바이더-무관 팩토리.
 * name 미지정/'openai' → OpenAI 구현. 그 외 → throw(미지원 프로바이더).
 * 길A/길B(correct/extract/chat/embed)는 LlmProvider 인터페이스에만 의존.
 */
export function getProvider(name: string | undefined, apiKey: string): LlmProvider {
  const provider = name ?? 'openai'
  if (provider === 'openai') {
    return createOpenAiProvider(apiKey)
  }
  throw new Error(`Unsupported LLM provider: ${provider}`)
}

export type { LlmProvider, ChatMessage } from './types'