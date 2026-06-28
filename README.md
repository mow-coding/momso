# momso (몸소)

강사 검수 기반 웰니스 수업 기록·공유 SaaS — Instructor-Verified Wellness Session Archiving & Sharing.

수업에서 오간 언어·감각·피드백을 강사가 검수해, 수련생에게 안전하게 기록·공유하는 서비스.

라이브 데모:
- https://momso-demo.vercel.app/prototype  (2026-06-12 InBodyLIKE 제출 데모, `apps/inbodylike-demo`)
- https://momso-alpha.vercel.app/  (2026-06-28 Primer 제출 알파, `apps/alpha`)

## 앱 구조 (`apps/`)
| 앱 | 설명 |
|---|---|
| `apps/inbodylike-demo` | InBodyLIKE 제출 데모 (동결, `momso-demo.vercel.app` 빌드 기준) |
| `apps/alpha` | Primer 제출 알파 웹앱 — Next.js (`momso-alpha.vercel.app` 빌드 기준) |
| `apps/web` | 베타 웹앱 (개발 예정) |
| `apps/mobile` | Expo 모바일 — 안드로이드+iOS 단일 코드 (개발 예정) |
| `apps/legacy-body-note` | 3월 원형(Body Note · 3D 해부학) 보존 (동결, 태그 `v0.0-legacy-body-note`) |

## 문서
- 제품 방향·설계 철학: `docs/product/`
- 개발·인프라·API/CLI/MCP 설계: `docs/development/`

## 개발
```bash
npm install
npm run dev     # 로컬 개발 서버 (apps/inbodylike-demo)
npm run build   # 프로덕션 빌드 (apps/inbodylike-demo/dist)
```
배포는 Vercel(`vercel.json`).

## 라이선스
MIT — `LICENSE` 참조.
