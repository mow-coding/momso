import 'server-only'

import { aesGcmEncrypt } from '@/lib/crypto'
import { routeClient } from '@/lib/supabase/route'

// BYOK 라우트: 사용자 OpenAI 키를 AES-256-GCM 암호화해 llm_credential에 보관.
// 평문 키는 절대 DB/응답에 노출하지 않음. 복호화는 다른 라우트(chat/embed/correct/extract)에서만.
export const runtime = 'nodejs'

type ByokBody = { apiKey?: unknown; provider?: unknown }

/** POST: 키 암호화 저장(유저당 1행 upsert). 평문/암호문 어느 것도 반환하지 않음. */
export async function POST(req: Request): Promise<Response> {
  let ctx
  try {
    ctx = await routeClient(req)
  } catch {
    return Response.json({ error: 'unauthorized' }, { status: 401 })
  }

  let body: ByokBody
  try {
    body = (await req.json()) as ByokBody
  } catch {
    return Response.json({ error: 'invalid_json' }, { status: 400 })
  }

  const apiKey = typeof body.apiKey === 'string' ? body.apiKey.trim() : ''
  if (!apiKey) {
    return Response.json({ error: 'missing_api_key' }, { status: 400 })
  }
  const provider = typeof body.provider === 'string' && body.provider.trim() ? body.provider.trim() : 'openai'

  let blob
  try {
    blob = aesGcmEncrypt(apiKey)
  } catch {
    // 마스터키 미설정/오류 등 서버 구성 문제. 평문은 절대 흘리지 않음.
    return Response.json({ error: 'encryption_unavailable' }, { status: 500 })
  }

  const { error } = await ctx.sb.from('llm_credential').upsert(
    {
      owner: ctx.userId,
      provider,
      iv: blob.iv,
      ciphertext: blob.ciphertext,
      auth_tag: blob.authTag,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'owner' },
  )

  if (error) {
    return Response.json({ error: 'save_failed' }, { status: 500 })
  }

  return Response.json({ ok: true })
}

/** GET: 키 설정 여부만 반환(존재 확인). 키·암호문·복호화 절대 반환 금지. */
export async function GET(req: Request): Promise<Response> {
  let ctx
  try {
    ctx = await routeClient(req)
  } catch {
    return Response.json({ error: 'unauthorized' }, { status: 401 })
  }

  const { count, error } = await ctx.sb
    .from('llm_credential')
    .select('owner', { count: 'exact', head: true })

  if (error) {
    return Response.json({ error: 'lookup_failed' }, { status: 500 })
  }

  return Response.json({ configured: (count ?? 0) > 0 })
}