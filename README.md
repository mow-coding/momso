# momso (몸소)

강사 검수 기반 웰니스 수업 기록·공유 SaaS (Instructor-Verified Wellness Session Archiving & Sharing).

몸을 소중히 여기는 실천. 수업에서 오간 언어·감각·피드백을 강사가 검수해, 수련생에게 안전하게 기록·공유하는 서비스.

## 라이브

- **알파 (현재 단계)**: https://momso-alpha.vercel.app
  - 개발자 센터: https://momso-alpha.vercel.app/docs
  - 요금제 (원가 공개): https://momso-alpha.vercel.app/pricing
  - 리소스: https://momso-alpha.vercel.app/resources
- 데모 (2026-06-12 InBodyLIKE 제출, 동결): https://momso-demo.vercel.app/prototype

## 앱 구조 (`apps/`)

momso는 한 제품을 시기별 단계로 개발하며, 각 단계 스냅샷을 그대로 보존한다:
데모 → 알파 → 베타 → 정식 런칭(웹 + 모바일).

| 앱 | 설명 |
|---|---|
| `apps/inbodylike-demo` | InBodyLIKE 제출 데모 (동결, `momso-demo.vercel.app` 빌드 기준) |
| `apps/alpha` | **알파 웹앱 (현재 개발 중)** · Next.js (`momso-alpha.vercel.app` 빌드 기준) |
| `apps/web` | 베타 웹앱 (개발 예정) |
| `apps/mobile` | 모바일 · Expo, iOS+Android 단일 코드 (개발 예정) |
| `apps/legacy-body-note` | 3월 원형 (Body Note · 3D 해부학) 보존 (동결, 태그 `v0.0-legacy-body-note`) |

## 문서

- 제품 방향·설계 철학: `docs/product/`
- 개발·인프라·API/CLI/MCP 설계: `docs/development/`
- 작동 원리·아키텍처·셀프 호스팅: [개발자 센터](https://momso-alpha.vercel.app/docs)

## 개발

```bash
npm install                              # 루트에서 1회 (npm 워크스페이스)
npm run dev --workspace apps/alpha       # 알파 (localhost:5174)
npm run dev                              # 데모 (apps/inbodylike-demo)
```

각 앱은 자기 Vercel 프로젝트로 배포된다 (Root Directory = 앱 폴더).

## 라이선스

MIT (`LICENSE` 참조).
