import { useEffect, useMemo, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { getSupabaseBrowserClient } from '../lib/supabase/client'
import {
  signInWithEmailOtp,
  signOut as signOutFromSupabase,
} from '../lib/supabase/repository'

type AuthStatus = 'loading' | 'unauthenticated' | 'sending-link' | 'authenticated'

export function useAuthSession() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), [])
  const [session, setSession] = useState<Session | null>(null)
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [error, setError] = useState<string | null>(null)
  const [lastEmail, setLastEmail] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    supabase.auth
      .getSession()
      .then(({ data, error: sessionError }) => {
        if (!active) {
          return
        }

        if (sessionError) {
          setError(sessionError.message)
          setStatus('unauthenticated')
          return
        }

        setSession(data.session)
        setStatus(data.session ? 'authenticated' : 'unauthenticated')
      })
      .catch((unexpectedError: unknown) => {
        if (!active) {
          return
        }

        setError(
          unexpectedError instanceof Error
            ? unexpectedError.message
            : 'Failed to read the current session.',
        )
        setStatus('unauthenticated')
      })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) {
        return
      }

      setSession(nextSession)
      setStatus(nextSession ? 'authenticated' : 'unauthenticated')
      setError(null)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [supabase])

  async function sendMagicLink(email: string) {
    setStatus('sending-link')
    setError(null)

    try {
      await signInWithEmailOtp(supabase, email)
      setLastEmail(email)
      setStatus('unauthenticated')
    } catch (authError) {
      setStatus('unauthenticated')
      setError(authError instanceof Error ? authError.message : 'Failed to send sign-in email.')
      throw authError
    }
  }

  async function signOut() {
    try {
      await signOutFromSupabase(supabase)
      setSession(null)
      setStatus('unauthenticated')
      setError(null)
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : 'Failed to sign out.')
      throw authError
    }
  }

  return {
    supabase,
    session,
    status,
    error,
    lastEmail,
    sendMagicLink,
    signOut,
  }
}
