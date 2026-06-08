# 협업 가이드

이 문서는 김성균과 유동환이 `momso` 저장소에서 함께 일하는 기본 규칙입니다.

## 역할

- **기획은 유동환과 김성균이 함께** 합니다.
- 유동환: 요가 도메인 지식을 고민해 아이디에이팅 문서를 올리고, 몸소 데모 앱의 **디자인을 전담**합니다. 리서치도 일부 합니다.
- 김성균: 자료를 정리하고 **리서치 대부분**을 수행하며, 데모 앱 **구현(개발)을 전담**합니다. 코드·데이터베이스·배포·기술 의사결정 담당.

### git 신원 (커밋 attribution)

- 유동환: `bigblue.yoga@gmail.com`
- 김성균: `mow.coding@gmail.com`
- 각자 자기 계정으로 커밋합니다. AI가 대신 작업할 때도 현재 머신의 git 사용자 신원을 그대로 씁니다(임의로 바꾸지 않음).

## 공식 표기

서비스 이름은 항상 `momso`로 씁니다.

좋은 예:

- `momso`
- `momso workspace`
- `momso dashboard`

피해야 할 예:

- 대문자로 시작하거나 중간에 대문자가 섞인 표기

대문자 혼용 표기는 사용하지 않습니다. 일반 문서, UI, 코드 주석에서는 `momso`를 기본으로 씁니다.

## 작업 공간 구분

- AI 작업 지침: `AGENTS.md`
- 문서 안내: `docs/README.md`
- 지원사업/공모전 자료실: `docs/support-programs/**`
- 기획 문서: `docs/planner/**`
- 제품 방향 기준: `docs/product/20260525_ProductDirection.md`
- 개발 문서: `docs/development/20260325_Infrastructure.md`, `docs/development/20260325_WebAppGuide.md`
- 코드: `apps/**`, `packages/**`, `supabase/**`

유동환은 기본적으로 `docs/planner/**` 안에서 작업합니다. 코드 변경이 필요하다고 느끼면 직접 코드 파일을 수정하기보다 기획 문서에 요청을 남기는 것을 우선합니다.

지원사업 일정, 제출 여부, 운영팀 문의, 평가 관련 행정 메모, 리서치, 회의록은 `docs/support-programs/**`에 둡니다. 예를 들어 2026 InbodyLike 자료는 `docs/support-programs/inbodylike-2026/**`에 모읍니다. 회의에서 실제로 챙겨야 할 행정 액션이 나오면 같은 지원사업 폴더의 `admin/**`에도 짧게 다시 기록합니다.

공동작업자가 자기 컴퓨터에서 Codex에게 "김성균이 최근에 업데이트한 사항을 내려받아줘", "리서치 및 금요일 회의 준비 사항을 확인해줘"라고 요청하면, Codex는 `docs/support-programs/inbodylike-2026/HANDOFF.md`를 먼저 읽어야 합니다.

## GitHub Pull Request 규칙

기획자가 올리는 Pull Request 제목:

```text
[planning] 작업 요약
```

예:

```text
[planning] 첫 대시보드 사용자 흐름 정리
[planning] onboarding figma handoff 추가
```

개발자가 올리는 Pull Request 제목:

```text
[dev] 작업 요약
```

## 자료 올리기 — 정리해서 PR로 (AI에게 위임할 때)

공동작업자가 자기 컴퓨터에서 Claude/Codex에게 "이거 김성균한테 공유하게 깃허브에 올려줘"처럼 두루뭉술하게 말해도, AI는 아래 흐름을 따른다. **`main`에 직접 push 금지.**

1. `git fetch` 후 `origin/main` 기준으로 **새 작업 브랜치**를 만든다 (예: `yoodonghwan/upload-YYYYMMDD-요약`).
2. 올릴 파일을 `AGENTS.md`의 "파일 배치 규칙"대로 **알맞은 위치로 정리**해서 넣는다. 로컬 폴더 구조가 달라도 저장소 표준 위치로 매핑한다. 서로 링크된 묶음은 `YYYYMMDD_영문슬러그/` 하위폴더로 묶고 그 폴더 `README.md` 색인에 한 줄 추가한다.
3. 어디 둘지 애매하면 루트에 두지 말고 사용자에게 한 번 확인한다.
4. 커밋하고 브랜치를 push한 뒤 **PR을 연다** (제목 `[planning] 요약` 또는 자료 정리면 `[docs] 요약`, PR 템플릿 채우고 확인필요=김성균 체크).
5. 병합/종료는 **김성균 검토 후**에 한다. AI가 공동작업자 PR을 임의로 병합하지 않는다.

이 흐름은 `.claude/skills/organize-and-upload` 스킬로 자동화돼 있다 — "정리해서 올려줘"류 요청에 이 스킬을 쓴다.

## 기획 Pull Request 체크리스트

PR을 올릴 때 아래를 확인합니다.

- `docs/planner/**` 안에 문서를 추가했는가?
- 문서 맨 위에 `상태`를 적었는가?
- 김성균이 확인해야 할 질문을 적었는가?
- figma 목업이 있다면 figma 링크를 적었는가?
- `momso` 표기를 지켰는가?

## figma 전달 방식

figma는 파일을 저장소에 직접 올리지 않습니다.

대신 `docs/planner/figma/`에 전달서를 만듭니다.

추천 파일 이름:

```text
docs/planner/figma/2026-05-25-home-dashboard-v1.md
```

전달서에는 figma 링크, 화면 목적, 사용자 흐름, 구현 우선순위, 미정인 부분을 적습니다.

## codex 대화 전달 방식

유동환이 자기 컴퓨터에서 codex와 대화한 내용은 `docs/planner/codex-sessions/`에 요약해서 올립니다.

전체 대화를 그대로 붙여넣기보다 아래를 정리합니다.

- 결정한 것
- 아직 미정인 것
- 김성균이 확인해야 할 것
- 다음에 이어갈 것

## 충돌을 줄이는 규칙

- 같은 문서를 동시에 고치지 않습니다.
- 기획자는 새 파일을 만드는 방식을 우선합니다.
- 기존 기획을 바꿀 때는 문서 맨 위의 상태나 변경 이유를 적습니다.
- 구현이 필요한 내용은 기획서의 `김성균에게 확인 받고 싶은 것`에 적습니다.
