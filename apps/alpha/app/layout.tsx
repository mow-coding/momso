import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import './globals.css'

const OG_DESC = '강사가 요가원 수업 기록을 검수해 리포트로 발행하고 AI로 활용하는 관리자 웹앱.'

export const metadata: Metadata = {
  metadataBase: new URL('https://momso-alpha.vercel.app'),
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
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    siteName: 'momso',
    url: 'https://momso-alpha.vercel.app/',
    title: 'momso — 몸을 소중히 여기는 실천',
    description: OG_DESC,
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'momso — 몸을 소중히 여기는 실천' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'momso — 몸을 소중히 여기는 실천',
    description: OG_DESC,
    images: ['/og.png'],
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
