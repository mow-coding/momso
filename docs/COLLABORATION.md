# 협업 가이드

이 문서는 김성균과 유동환이 `momso` 저장소에서 함께 일하는 기본 규칙입니다.

## 역할

- 김성균: 개발자. 코드, 데이터베이스, 배포, 기술 의사결정을 담당합니다.
- 유동환: 기획자. 제품 방향, 사용자 흐름, 화면 기획, figma 목업을 담당합니다.

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
