import type { MetadataRoute } from 'next'

// PWA 설치형 매니페스트 (Chrome/Edge 데스크톱 설치용).
// 오프라인/서비스워커/푸시/백그라운드 일절 없음 — 순수 설치형 창.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'momso',
    short_name: 'momso',
    description: '몸을 소중히 여기는 실천 — 요가 강사를 위한 AI 위키',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#e26d5c',
    lang: 'ko',
    icons: [
      { src: '/icon-192.png?v=2', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png?v=2', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-512-maskable.png?v=2', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
