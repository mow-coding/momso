'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { useAuth, signOut } from '@/lib/auth'
import { useWorkspaces, setActiveWorkspace, createWorkspace } from '@/lib/workspace'
import { useDB } from '@/lib/store'
import Login from '@/components/Login'
import HomeView from '@/components/HomeView'
import UploadView from '@/components/UploadView'
import ReviewView from '@/components/ReviewView'
import ChatView from '@/components/ChatView'
import WikiView from '@/components/WikiView'
import SettingsView from '@/components/SettingsView'
import Footer from '@/components/Footer'
import BrandIcon, { type BrandName } from '@/components/BrandIcon'

type View = 'home' | 'upload' | 'review' | 'chat' | 'wiki' | 'settings'

// 헤더(제목·부제)의 유일 출처. 사이드바는 라벨만 쓰고, desc는 헤더에서만 노출(중복 금지).
const NAV: { key: View; label: string; desc: string; icon: ReactNode }[] = [
  {
    key: 'home',
    label: '홈',
    desc: '최근 활동과 위키 현황을 한눈에.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-[1.25em] w-[1.25em] shrink-0">
        <path d="M4 10.5 12 4l8 6.5" />
        <path d="M6 9.5V20h12V9.5" />
      </svg>
    ),
  },
  {
    key: 'upload',
    label: '업로드',
    desc: '요가원 파일을 올리고 종류로 태깅합니다.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-[1.25em] w-[1.25em] shrink-0">
        <path d="M12 16V5" />
        <path d="m7.5 9 4.5-4.5L16.5 9" />
        <path d="M5 19h14" />
      </svg>
    ),
  },
  {
    key: 'review',
    label: '검수',
    desc: '보정본을 확인하고 AI 초점을 검수해 발행합니다.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-[1.25em] w-[1.25em] shrink-0">
        <path d="M5 12.5 10 17l9-10" />
      </svg>
    ),
  },
  {
    key: 'chat',
    label: '대화',
    desc: '몸이(AI)와 대화하며 위키를 활용하고 바로 발행합니다.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-[1.25em] w-[1.25em] shrink-0">
        <path d="M5 5h14v10H9l-4 4V5Z" />
      </svg>
    ),
  },
  {
    key: 'wiki',
    label: '위키',
    desc: '발행된 기록과 수련생 종단을 봅니다.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-[1.25em] w-[1.25em] shrink-0">
        <path d="M6 4h9l3 3v13H6V4Z" />
        <path d="M9 9h6M9 12.5h6M9 16h4" />
      </svg>
    ),
  },
]

const SETTINGS_DESC = 'Supabase 연결 · 생성·임베딩 프로바이더 · 몸소 딕셔너리.'

// 뷰별 브랜드 CI 아이콘(헤더) — bahiranga 녹음 / antaranga 검수 / asana 대화 / astanga 위키.
const VIEW_BRAND: Partial<Record<View, BrandName>> = {
  upload: 'bahiranga',
  review: 'antaranga',
  chat: 'asana',
  wiki: 'astanga',
}

export default function Page() {
  const { user, loading } = useAuth()
  const { workspaces, active, loaded: wsLoaded } = useWorkspaces()
  const db = useDB()
  const [view, setView] = useState<View>('home')
  // 서버/첫 클라 렌더 일치(하이드레이션 안전)
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  if (!mounted || loading) return <div className="p-8 text-sm text-body-muted">로딩…</div>
  if (!user) return <Login />

  const isSettings = view === 'settings'
  const nav = NAV.find((n) => n.key === view)
  const title = isSettings ? '설정' : nav?.label
  const desc = isSettings ? SETTINGS_DESC : nav?.desc
  const headerBrand = isSettings ? undefined : VIEW_BRAND[view]

  // 내비 카운트 — store 실값만(가짜 수치 0). 0이면 배지 자체를 렌더하지 않음.
  const draftCount = db.zets.filter((z) => z.status === 'draft').length
  const publishedCount = db.zets.filter((z) => z.status === 'published').length
  const navCount: Partial<Record<View, number>> = { review: draftCount, chat: publishedCount }

  async function addWorkspace() {
    const name = window.prompt('새 워크스페이스 이름 (예: 빅블루 요가)')?.trim()
    if (name) await createWorkspace(name)
  }

  const initial = (user.name ?? user.email ?? '강')!.trim().charAt(0).toUpperCase()

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-60 shrink-0 flex-col border-r border-body-border bg-body-surface p-4">
        {/* ① 워드마크 — agar yoga 마크 + 소문자 워드마크 락업(Login 대형과 위계 구분). */}
        <div className="mb-4 flex items-center gap-2 px-2">
          <BrandIcon name="agar-yoga" size={24} />
          <span className="text-lg font-semibold tracking-[-0.01em]">momso</span>
        </div>

        {/* ② 워크스페이스 전환기 — 활성 표식은 좌측 코랄 점 한 개. */}
        <div className="mb-6 flex items-center gap-1.5 px-2">
          <span className="accent-dot shrink-0" aria-hidden />
          <select
            className="field-select mt-0 min-w-0 flex-1 truncate py-1.5"
            value={active?.id ?? ''}
            onChange={(e) => setActiveWorkspace(e.target.value)}
            aria-label="워크스페이스"
          >
            {!wsLoaded && <option value="">불러오는 중…</option>}
            {workspaces.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
          <button className="btn btn-ghost shrink-0 px-2 py-1.5" title="새 워크스페이스" onClick={addWorkspace}>
            ＋
          </button>
        </div>

        {/* ③ 주 내비 — 라벨만(desc는 헤더로). 검수·대화는 우측 실값 카운트. */}
        <nav className="space-y-1">
          {NAV.map((n) => {
            const isActive = view === n.key
            const c = navCount[n.key]
            return (
              <button
                key={n.key}
                onClick={() => setView(n.key)}
                aria-current={isActive ? 'page' : undefined}
                className={`nav-item ${isActive ? 'nav-item-active' : ''}`}
              >
                {n.icon}
                <span className="min-w-0 flex-1 truncate">{n.label}</span>
                {c ? <span className="count-badge">{c}</span> : null}
              </button>
            )
          })}
        </nav>

        {/* ④ 하단 — 설정 · 계정(1회) · 로그아웃 · Footer(앱 전체 1회). */}
        <div className="mt-auto space-y-1 pt-8">
          <button
            onClick={() => setView('settings')}
            aria-current={isSettings ? 'page' : undefined}
            className={`nav-item ${isSettings ? 'nav-item-active' : ''}`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-[1.25em] w-[1.25em] shrink-0">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 3.5v2M12 18.5v2M4.7 7.5l1.7 1M17.6 15.5l1.7 1M4.7 16.5l1.7-1M17.6 8.5l1.7-1" />
            </svg>
            <span>설정</span>
          </button>

          <div className="flex items-center gap-2 px-2 pt-3">
            <span
              aria-hidden
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sage text-[11px] font-semibold text-body-text"
            >
              {initial}
            </span>
            <div className="min-w-0 flex-1 leading-tight">
              <div className="truncate text-[13px] font-medium text-body-text">
                {user.name ?? user.email ?? '강사'}
              </div>
              {user.name && user.email && (
                <div className="truncate text-[11px] text-body-muted">{user.email}</div>
              )}
            </div>
          </div>

          <button className="nav-item text-body-muted" onClick={signOut}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-[1.25em] w-[1.25em] shrink-0">
              <path d="M14 7V5H5v14h9v-2" />
              <path d="M10 12h9M16 9l3 3-3 3" />
            </svg>
            <span>로그아웃</span>
          </button>

          <Footer className="px-2 pt-3" />
        </div>
      </aside>

      <main className="min-w-0 flex-1 overflow-y-auto p-8 max-[1024px]:px-6">
        {/* 헤더 = 화면 제목·설명의 유일 출처(중복 금지). 화면별 주 액션 1개 슬롯. */}
        <header className="mb-8 flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            {headerBrand && <BrandIcon name={headerBrand} size={30} className="mt-0.5" />}
            <div className="min-w-0">
              <h1 className="text-xl font-semibold tracking-[0.01em]">{title}</h1>
              <p className="mt-1 text-sm text-body-muted">{desc}</p>
            </div>
          </div>
        </header>

        {view === 'home' ? (
          <HomeView onNavigate={setView} />
        ) : view === 'upload' ? (
          <UploadView onNavigate={setView} />
        ) : view === 'review' ? (
          <ReviewView onNavigate={setView} />
        ) : view === 'chat' ? (
          <ChatView onNavigate={setView} />
        ) : view === 'wiki' ? (
          <WikiView onNavigate={setView} />
        ) : (
          <SettingsView />
        )}
      </main>
    </div>
  )
}
