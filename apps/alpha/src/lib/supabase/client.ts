import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

/** Supabase가 env로 설정돼 있는가. 없으면 데모(미설정) 모드. */
export const isSupabaseConfigured = Boolean(url && key)

let client: SupabaseClient | null = null

/** Supabase 브라우저 클라이언트(싱글톤). env 미설정이면 null. */
export function getSupabase(): SupabaseClient | null {
  if (client) return client
  if (!url || !key) return null
  client = createClient(url, key, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  })
  return client
}
