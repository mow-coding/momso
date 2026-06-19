import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

let browserClient:
  | ReturnType<typeof createClient>
  | null = null

export function getSupabaseBrowserClient() {
  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error(
      'Supabase environment variables are missing. Fill in VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in the root .env file.',
    )
  }

  if (!browserClient) {
    browserClient = createClient(supabaseUrl, supabasePublishableKey)
  }

  return browserClient
}
