import 'server-only';

import type { ChatOpts, EmbedOpts, LlmProvider } from './types';
import { DEFAULT_CHAT_MODEL, EMBED_DIM, EMBED_MODEL } from './index';

const OPENAI_BASE = 'https://api.openai.com/v1';

// OpenAI 응답 형태(필요한 필드만). SDK 미사용 — fetch 직접 호출.
type ChatCompletionResponse = {
  choices?: { message?: { content?: string | null } }[];
};

type EmbeddingResponse = {
  data?: { embedding?: number[] }[];
};

/**
 * 비2xx 응답을 상태코드 + 본문 요약과 함께 throw.
 * 본문은 길 수 있으므로 앞부분만 잘라 정직한 에러 메시지로 노출.
 */
async function throwHttpError(res: Response, label: string): Promise<never> {
  let detail = '';
  try {
    detail = await res.text();
  } catch {
    detail = '(본문 읽기 실패)';
  }
  const summary = detail.length > 500 ? `${detail.slice(0, 500)}…` : detail;
  throw new Error(`OpenAI ${label} 실패 (${res.status} ${res.statusText}): ${summary}`);
}

/**
 * 프로바이더-무관 어댑터 뒤의 OpenAI 구현(BYOK).
 * apiKey는 서버 라우트에서 복호화 직후 전달되며, 브라우저에는 절대 닿지 않는다.
 */
export function createOpenAiProvider(apiKey: string): LlmProvider {
  const authHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  };

  return {
    async chat(opts: ChatOpts): Promise<{ text: string }> {
      const body: Record<string, unknown> = {
        model: opts.model ?? DEFAULT_CHAT_MODEL,
        messages: opts.messages,
        temperature: opts.temperature ?? 0,
      };
      // 무결성: extract/correct는 JSON 스키마 엄수가 필요 → JSON 모드 강제.
      if (opts.responseFormat === 'json') {
        body.response_format = { type: 'json_object' };
      }

      const res = await fetch(`${OPENAI_BASE}/chat/completions`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        await throwHttpError(res, 'chat/completions');
      }

      const json = (await res.json()) as ChatCompletionResponse;
      const text = json.choices?.[0]?.message?.content ?? '';
      return { text };
    },

    async embed(texts: string[], opts?: EmbedOpts): Promise<number[][]> {
      // 빈 입력은 호출 없이 빈 배열 — 불필요한 API/비용 차단.
      if (texts.length === 0) return [];

      const res = await fetch(`${OPENAI_BASE}/embeddings`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          model: opts?.model ?? EMBED_MODEL,
          input: texts,
          dimensions: opts?.dimensions ?? EMBED_DIM,
        }),
      });
      if (!res.ok) {
        await throwHttpError(res, 'embeddings');
      }

      const json = (await res.json()) as EmbeddingResponse;
      return (json.data ?? []).map((d) => d.embedding ?? []);
    },
  };
}
