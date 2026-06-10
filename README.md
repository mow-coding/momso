# momso (몸소)

Instructor-Verified Wellness Session Archiving & Sharing SaaS — 강사 검수 기반 웰니스 수업 기록·공유 SaaS.

이 레포의 본체는 `apps/web`의 몸소 데모 앱이다. 라이브 데모: https://momso.vercel.app/prototype

과거의 3D 해부학 프로젝트(Body Note)는 폐기되어 main에서 제거됐다(이력은 git 히스토리에 보존).

## Start Here

- 앱 PRD v2 (6/9 확정 IA·디자인 브리프): `docs/planner/briefs/20260609_inbodylike_prd_v2_app_restructure.md`
- 피치덱 논리 마스터: `docs/support-programs/inbodylike-2026/admin/applications/20260608_pitchdeck_logic_master_check.md`
- BM 수익성 J커브 모델: `docs/support-programs/inbodylike-2026/research/20260609_bm_profitability_jcurve_model.md`
- 협업 가이드: `docs/COLLABORATION.md`
- 지원사업: `docs/support-programs/README.md`

## 개발

```bash
npm install
npm run dev     # 로컬 개발 서버
npm run lint
npm run build   # 프로덕션 빌드 (apps/web/dist)
```

배포는 Vercel(`vercel.json`)로, main이 곧 배포 기준이다.
