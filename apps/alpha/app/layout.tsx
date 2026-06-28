import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import './globals.css'

export const metadata: Metadata = {
  title: 'momso 알파',
  description:
    '몸을 소중히 여기는 실천 — 강사가 요가원 기록을 검수해 리포트로 발행하고 AI로 활용하는 관리자 웹앱',
  applicationName: 'momso',
  icons: {
    icon: [
      { url: '/favicon-32.png?v=3', sizes: '32x32', type: 'image/png' },
      { url: '/icon-192.png?v=2', sizes: '192x192', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png?v=2',
  },
}

// PWA 테마색(설치 창 상단·OS 표시). 오프라인 기능 없음 — 순수 설치형.
export const viewport: Viewport = {
  themeColor: '#e26d5c',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}
