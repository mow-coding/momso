# AGENTS.md

## 사용자/협업 맥락

- 사용자는 초보 바이브코더이며, 설명은 쉽게 풀어야 한다.
- 사용자는 프로 개발자처럼 일하고 싶어하므로, 계획을 세우고 진행 상황을 기록하며 피드백 루프를 유지한다.
- `momso` 공식 표기는 항상 소문자 `momso`다.
- UI/UX 수정은 사용자의 명시적 지시 없이 임의로 확장하지 않는다.

## 문서 우선 규칙

- 지원사업, 공모전, 회의록, 리서치, 행정 자료는 `docs/support-programs/**`를 먼저 확인한다.
- 2026 InbodyLike 1기 관련 작업은 `docs/support-programs/inbodylike-2026/**`에서 시작한다.
- 공동작업자가 "최근 업데이트를 내려받아줘", "김성균이 올린 리서치/회의 준비 사항을 확인해줘", "금요일 회의 준비 사항을 봐줘"라고 말하면 먼저 `docs/support-programs/inbodylike-2026/HANDOFF.md`를 읽는다.
- 제품 기획 초안은 `docs/planner/**`, 합의된 제품 방향은 `docs/product/**`, 개발/인프라 문서는 `docs/development/**`에 둔다.

## 파일 배치 규칙 (공동작업자·AI 필독 — 어기지 말 것)

- **저장소 루트에 자료 폴더를 새로 만들지 않는다.** `NN_한글이름/`(예: `04_발표준비/`) 같은 번호 폴더를 루트에 두는 것 금지. 루트는 코드/설정 전용.
- 지원사업·공모전·회의록·리서치·행정·발표 자료는 **반드시** `docs/support-programs/inbodylike-2026/**` 아래 알맞은 폴더에 넣는다:
  - 리서치·시장조사·근거 → `research/`
  - 사업계획서·지원서·발표 원고 → `admin/applications/`
  - 내부 회의록 → `meetings/internal/` · 파트너/멘토/자문 회의 → `meetings/partners/`
  - 문의 → `admin/inquiries/` · 일정·마감 → `admin/schedules/`
- 서로 링크된 여러 파일은 `YYYYMMDD_영문슬러그/` 하위폴더로 묶고, 그 상위 폴더 `README.md` 색인 표에 한 줄 추가한다.
- 어디 둘지 모르면 **루트에 임시로라도 두지 말고**, 각 폴더의 `README.md`와 이 규칙을 먼저 확인한다.

## Git 안전 규칙

- `git status --short`로 현재 변경사항을 먼저 확인한다.
- 공동작업자의 로컬 변경사항을 덮어쓰지 않는다.
- pull이 필요하고 워킹트리가 깨끗하면 `git pull --ff-only`를 우선한다.
- 로컬 변경사항이 있으면 임의로 stash/reset/checkout하지 말고, 사용자에게 현재 상태와 선택지를 설명한다.
- 공동작업자가 "올려줘/공유해줘"라고 하면 `main`에 직접 push하지 않는다. 새 브랜치를 만들어 "파일 배치 규칙"대로 정리·커밋한 뒤 **PR을 연다**(흐름: `docs/COLLABORATION.md`의 "자료 올리기" 절 / `organize-and-upload` 스킬). 공동작업자 PR 병합은 김성균 검토 후.
