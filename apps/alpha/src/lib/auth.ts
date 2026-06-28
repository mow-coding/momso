import { useSyncExternalStore } from 'react'
import { getSupabase, isSupabaseConfigured } from './supabase/client'
import { loadDB, clearDB } from './store'
import { loadWorkspaces, clearWorkspaces } from './workspace'

export type SessionUser = { id: string; email?: string; name?: string }

type AuthState = { user: SessionUser | null; loading: boolean }

let state: AuthState = { user: null, loading: isSupabaseConfigured }
const listeners = new Set<() => void>()

function subscribe(cb: () => void) {
  listeners.add(cb)
  return () => {
    listeners.delete(cb)
  }
}

function getSnapshot(): AuthState {
  return state
}

function setState(patch: Partial<AuthState>) {
  state = { ...state, ...patch }
  listeners.forEach((l) => l())
}

type SbUser = { id: string; email?: string | null; user_metadata?: Record<string, unknown> }

function toUser(u: SbUser | null | undefined): SessionUser | null {
  if (!u) return null
  const name =
    (u.user_metadata?.name as string | undefined) ?? (u.user_metadata?.full_name as string | undefined)
  return { id: u.id, email: u.email ?? undefined, name }
}

// 브라우저에서만 Supabase 세션 구독 (SSR 안전)
if (typeof window !== 'undefined' && isSupabaseConfigured) {
  const supabase = getSupabase()!
  supabase.auth.onAuthStateChange((_event, session) => {
    const user = toUser(session?.user as SbUser | undefined)
    setState({ user, loading: false })
    if (user) void loadWorkspaces().then(() => loadDB())
    else {
      clearWorkspaces()
      clearDB()
    }
  })
}

export function useAuth() {
  const s = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
  return { user: s.user, loading: s.loading, isSupabaseConfigured }
}

/** Google Identity Services 버튼이 발급한 ID 토큰으로 Supabase 로그인. */
export async function signInWithGoogleIdToken(token: string, nonce?: string) {
  const supabase = getSupabase()
  if (!supabase) {
    return { data: { user: null, session: null }, error: { message: 'Supabase 미설정' } as { message: string } }
  }
  // nonce: GIS엔 hashed, 여기엔 raw를 넘김(Supabase가 해시 대조)
  return supabase.auth.signInWithIdToken({ provider: 'google', token, nonce })
}

export async function signOut() {
  const supabase = getSupabase()
  if (supabase) await supabase.auth.signOut()
  setState({ user: null, loading: false })
  clearWorkspaces()
  clearDB()
}
