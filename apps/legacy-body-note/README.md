# legacy body-note (2026-03 원형, 동결)

몸소의 **3월 원형(`body note`)** 3D 해부학 앱 코드를 그대로 보존한 슬롯이다.
2026-03-25 커밋 `b911109`("initialize body note project") 시점의 `apps/web/` 전체를 여기에 실물로 옮겨 두었다.

## 무엇인가

`@react-three/fiber`·`three.js` 기반의 3D 인체 해부학 뷰어 프로토타입. 주요 부분:

- `features/viewer/AnatomyCanvas.tsx`, `ViewerPane.tsx` — 3D 해부 캔버스/뷰어
- `features/timeline/` — 타임라인 컨트롤·프레임 동기화
- `features/threads/` — 주석(annotation)·스레드 사이드바
- `stores/useWorkspaceStore.ts`, `workspaceSeed.ts` — 워크스페이스 상태/시드
- `components/`, `src/`, `styles/` — UI·진입점·스타일

이후 momso는 3D 해부학에서 **강사 검수형 웰니스 기록 SaaS**로 방향을 틀었고(→ `docs/product/20260525_ProductDirection.md`), 그 코드는 `apps/inbodylike-demo`(InBodyLIKE 제출 데모)로 이어진다.

## 동결 / 빌드 정책

- **동결 보관용.** 루트 `package.json`의 workspaces에 포함되지 않으므로 `npm install`/`npm run build`/Vercel 배포에 **영향이 없다**(패키지명 `@body-note/web`).
- 별도로 돌려 보려면 이 폴더에서 직접 `npm install && npm run dev`.
- 이중 안전: 동일 시점이 git 태그 **`v0.0-legacy-body-note`** 에도 그대로 보존돼 있다.

> 선행 증거(prior-art): 이 폴더가 곧 "몸소 팀이 2026-03부터 실제로 3D 앱을 만들고 있었다"는 *말이 아닌 실제 코드* 증거다.
