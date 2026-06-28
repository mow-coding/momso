'use client'

import { useEffect, useRef, useState } from 'react'
import { signInWithGoogleIdToken } from '../lib/auth'
import Footer from './Footer'
import BrandIcon from './BrandIcon'

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
const GSI_SRC = 'https://accounts.google.com/gsi/client'

type GsiId = {
  initialize: (c: {
    client_id: string
    callback: (r: { credential?: string }) => void
    nonce?: string
    use_fedcm_for_prompt?: boolean
    cancel_on_tap_outside?: boolean
  }) => void
  renderButton: (el: HTMLElement, o: Record<string, unknown>) => void
}
declare global {
  interface Window {
    google?: { accounts?: { id?: GsiId } }
  }
}

function loadGsi(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) return resolve()
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GSI_SRC}"]`)
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error('gsi load')), { once: true })
      return
    }
    const s = document.createElement('script')
    s.src = GSI_SRC
    s.async = true
    s.defer = true
    s.addEventListener('load', () => resolve(), { once: true })
    s.addEventListener('error', () => reject(new Error('gsi load')), { once: true })
    document.head.appendChild(s)
  })
}

/** raw nonce + SHA-256 hashed nonce (raw→Supabase, hashed→Google). */
async function makeNonce(): Promise<{ raw: string; hashed: string }> {
  const raw = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))))
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw))
  const hashed = Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  return { raw, hashed }
}

export default function Login() {
  const btnRef = useRef<HTMLDivElement | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) {
      setStatus('error')
      setErr('구글 로그인 미설정 (NEXT_PUBLIC_GOOGLE_CLIENT_ID).')
      return
    }
    let cancelled = false

    async function setup() {
      try {
        const { raw, hashed } = await makeNonce()
        await loadGsi()
        if (cancelled) return
        const id = window.google?.accounts?.id
        if (!id || !btnRef.current) {
          setStatus('error')
          setErr('구글 스크립트 초기화 실패. 새로고침 해주세요.')
          return
        }
        id.initialize({
          client_id: GOOGLE_CLIENT_ID as string,
          callback: async (resp) => {
            if (!resp.credential) {
              setErr('구글 응답이 비었어요. 다시 시도해 주세요.')
              return
            }
            const { error } = await signInWithGoogleIdToken(resp.credential, raw)
            if (error) setErr('로그인 실패: ' + error.message)
          },
          nonce: hashed,
          use_fedcm_for_prompt: true, // 서드파티 쿠키 폐지 대응(최신 공식)
          cancel_on_tap_outside: true,
        })
        btnRef.current.replaceChildren()
        // Google이 직접 렌더하는 공식 버튼
        id.renderButton(btnRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          shape: 'pill',
          logo_alignment: 'left',
          width: 320,
          locale: 'ko',
        })
        setStatus('ready')
      } catch {
        if (cancelled) return
        setStatus('error')
        setErr('구글 로그인 버튼을 불러오지 못했어요. 새로고침 해주세요.')
      }
    }

    void setup()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <main className="relative min-h-screen overflow-hidden bg-body-bg text-body-text">
      {/* 차분한 배경: 위쪽 세이지 워시 + 코랄 빛 한 줄 */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 80% at 50% -10%, var(--color-sage) 0%, rgba(237,241,237,0) 55%)',
        }}
      />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-accent" />

      {/* 브랜드 배너 — 요가 동작 라인아트 프리즈(바닥 풀폭 장식, 잉크-온-투명). 콘텐츠는 그 위에. */}
      <img
        src="/brand/banner.png"
        alt=""
        aria-hidden
        draggable={false}
        className="pointer-events-none absolute inset-x-0 bottom-0 w-full select-none opacity-[0.55]"
      />

      <div className="relative mx-auto flex min-h-screen max-w-md flex-col px-6">
        {/* 본문: 에디토리얼 워드마크가 주인공 */}
        <div className="flex flex-1 flex-col justify-center py-12">
          {/* agar yoga — 메인 서비스 로고(검수 antaranga + 녹음 bahiranga의 합) */}
          <BrandIcon name="agar-yoga" size={76} className="mb-6 -ml-2" />
          <h1 className="text-[64px] font-semibold leading-[0.95] tracking-[-0.04em] sm:text-[76px]">
            momso
          </h1>
          {/* 워드마크 코랄 마이크로 밑줄 바 (방향 A 이식) */}
          <span aria-hidden className="mt-4 block h-[3px] w-10 rounded-full bg-accent" />

          <p className="mt-7 text-[22px] font-semibold leading-snug tracking-[-0.01em] text-body-text">
            몸을 소중히 여기는 실천
          </p>
        </div>

        {/* 하단: 로그인 — 카드 없이 조용히 */}
        <div className="pb-10 pt-2">
          {/* 구분선 — 가운데 코랄 점 (방향 A 이식) */}
          <div className="flex items-center gap-3" aria-hidden>
            <span className="h-px flex-1 bg-body-border" />
            <span className="h-1 w-1 rounded-full bg-accent" />
            <span className="h-px flex-1 bg-body-border" />
          </div>

          <p className="mt-7 text-center text-[13px] text-body-muted">강사 계정으로 시작하세요.</p>

          <div className="mt-4 flex flex-col items-center">
            {/* GIS 공식 버튼 — 중앙 박스 정렬로 넓은 화면 헐거움 보완(개선 메모) */}
            <div ref={btnRef} className="flex min-h-[44px] w-full max-w-[320px] justify-center" />

            {status === 'loading' && !err && (
              <p className="mt-3 flex items-center gap-2 text-[12px] text-body-muted">
                <span
                  aria-hidden
                  className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-accent"
                />
                구글 로그인 불러오는 중…
              </p>
            )}
            {err && (
              <p
                role="alert"
                className="mt-3 w-full max-w-[320px] rounded-[6px] bg-accent-soft px-3 py-2 text-center text-[12px] text-accent-strong"
              >
                {err}
              </p>
            )}
          </div>

          <Footer className="mt-8 text-center" />
        </div>
      </div>
    </main>
  )
}
