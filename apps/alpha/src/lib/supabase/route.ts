import 'server-only'

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

import { aesGcmDecrypt } from '@/lib/crypto'

/** 라우트 핸들러 컨텍스트: 요청 유저 RLS로 스코프된 Supabase 클라 + 유저 id. */
export type RouteCtx = { sb: SupabaseClient; userId: string }

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

/**
 * 요청의 Bearer 토큰(supabase access token)으로 Supabase 라우트 클라를 만든다.
 * 클라는 그 토큰을 Authorization 헤더로 달고 동작하므로 RLS=해당 유저로 스코프된다.
 * service_role 미사용(RLS로 충분). getUser() 실패 시 throw(401 매핑).
 */
export async function routeClient(req: Request): Promise<RouteCtx> {
  if (!url || !key) throw new Error('SUPABASE_NOT_CONFIGURED')

  const authHeader = req.headers.get('authorization') ?? req.headers.get('Authorization')
  const token = authHeader?.toLowerCase().startsWith('bearer ')
    ? authHeader.slice(7).trim()
    : ''
  if (!token) throw new Error('UNAUTHORIZED')

  const sb = createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data, error } = await sb.auth.getUser()
  if (error || !data?.user) throw new Error('UNAUTHORIZED')

  return { sb, userId: data.user.id }
}

/**
 * 자기 llm_credential 단일행을 select → AES-256-GCM 복호화해 평문 키 반환.
 * 복호화는 오직 서버(라우트)에서 OpenAI 호출 직전에만. 키 없으면 throw('NO_KEY').
 */
export async function loadDecryptedKey(ctx: RouteCtx): Promise<string> {
  const { data, error } = await ctx.sb
    .from('llm_credential')
    .select('iv, ciphertext, auth_tag')
    .eq('owner', ctx.userId)
    .maybeSingle()

  if (error) throw new Error(`KEY_LOAD_FAILED: ${error.message}`)
  if (!data) throw new Error('NO_KEY')

  return aesGcmDecrypt({
    iv: data.iv as string,
    ciphertext: data.ciphertext as string,
    authTag: data.auth_tag as string,
  })
}