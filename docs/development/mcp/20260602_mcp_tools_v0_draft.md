# momso MCP Tools v0 Draft

상태: draft
작성일: 2026-06-02

## 목적

AI 에이전트가 momso 수업 기록을 안전하게 다룰 수 있도록 MCP 도구 후보를 정의한다.

현재는 구현 완료 문서가 아니라 설계 초안이다.

## 원칙

- MCP는 원본 녹음 파일을 기본으로 읽지 않는다.
- MCP는 검수 상태를 제안할 수 있지만 최종 확정권은 강사에게 있다.
- MCP는 수련생에게 자동 발송하지 않는다.
- MCP 응답에는 개인정보와 타인 정보가 최소화되어야 한다.

## 도구 후보

### `momso.list_classes`

수업 목록을 조회한다.

입력:

```json
{
  "date": "2026-06-02",
  "studioId": "bigblue"
}
```

출력:

```json
{
  "classes": [
    {
      "id": "class_20260602_hatha_basic",
      "title": "하타 베이직",
      "time": "19:30"
    }
  ]
}
```

### `momso.get_class_context`

수업 맥락을 조회한다.

포함 후보:

- 수업명
- 참여 수련생 수
- 동의 상태
- 최근 참고 지표
- 지난 수업 관찰 포인트

### `momso.list_review_items`

AI 초안과 현재 강사 검수 상태를 조회한다.

출력 상태:

- `draft`
- `shareable`
- `internal`
- `hold`
- `excluded`

### `momso.propose_review_status`

AI가 공유 범위를 제안한다.

주의:

- 이 도구는 최종 상태를 바꾸지 않는다.
- 응답은 `suggestedStatus`와 이유만 제공한다.

### `momso.update_review_status`

강사 승인 컨텍스트에서 검수 상태를 바꾼다.

주의:

- 사람이 승인한 action만 실행한다.
- 자동 에이전트가 단독으로 호출하지 않는다.

### `momso.publish_report`

검수된 항목만 수련생 리포트로 발행한다.

가드:

- `shareable` 항목이 없으면 실패한다.
- `draft`, `hold`, `internal`, `excluded` 항목은 발행하지 않는다.

### `momso.get_student_archive`

수련생 개인 아카이브를 조회한다.

주의:

- 원본 녹음은 포함하지 않는다.
- 외부 연결 동의 상태를 함께 반환한다.

## PoC에서 검증할 것

- Claude/Codex 같은 AI가 리뷰 보조 도구로 안전하게 쓰일 수 있는가?
- 강사 검수권을 어떻게 UI와 MCP 권한 양쪽에서 보장할 것인가?
- 수련생 기록을 외부 AI 도구에 연결할 때 어떤 동의 범위가 필요한가?
