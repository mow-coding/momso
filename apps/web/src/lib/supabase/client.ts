import { createClient } from '@supabase/supabase-js'
import { getAppEnv } from '../env'
import type { Database } from './database'

let browserClient:
  | ReturnType<typeof createClient<Database>>
  | null = null

export function getSupabaseBrowserClient() {
  const env = getAppEnv()

  if (!browserClient) {
    browserClient = createClient<Database>(
      env.VITE_SUPABASE_URL,
      env.VITE_SUPABASE_PUBLISHABLE_KEY,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      },
    )
  }

  return browserClient
}
