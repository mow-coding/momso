# momso (몸소)

Instructor-Verified Wellness Session Archiving & Sharing SaaS — 강사 검수 기반 웰니스 수업 기록·공유 SaaS.

라이브 데모: https://momso.vercel.app/prototype (InBodyLIKE 제출 데모, `apps/inbodylike-demo`에서 빌드).

과거의 3D 해부학 프로젝트(Body Note)는 폐기되어 main에서 제거됐다(원형 코드는 git 태그 `v0.0-legacy-body-note`에 보존).

## 앱 구조 (`apps/`)

| 앱 | 설명 |
|---|---|
| `apps/inbodylike-demo` | **동결.** 2026-06 InBodyLIKE 제출 데모. `momso.vercel.app` 빌드 기준. |
| `apps/web` | 베타 웹앱 (개발 예정 슬롯). |
| `apps/mobile` | Expo 모바일 — 안드로이드+iOS 단일 코드 (개발 예정 슬롯). |
| `apps/legacy-body-note` | 3월 원형(Body Note) 보존 포인터 → 태그 `v0.0-legacy-body-note`. |

## Start Here

- **공개 전환 참조 지도** (공개판 만들 때 무엇을 어떻게 다룰지): `docs/PUBLICATION_MAP.md`
- 문서 폴더 안내: `docs/README.md`
- 앱 PRD v2 (6/9 확정 IA·디자인 브리프): `docs/planner/briefs/20260609_inbodylike_prd_v2_app_restructure.md`
- 피치덱 논리 마스터: `docs/support-programs/inbodylike-2026/admin/applications/20260608_pitchdeck_logic_master_check.md`
- 협업 가이드: `docs/COLLABORATION.md`
- 지원사업 자료실: `docs/support-programs/README.md`

## 개발

```bash
npm install
npm run dev     # 로컬 개발 서버 (apps/inbodylike-demo)
npm run lint
npm run build   # 프로덕션 빌드 (apps/inbodylike-demo/dist)
```

배포는 Vercel(`vercel.json`)로, main이 곧 배포 기준이다.
