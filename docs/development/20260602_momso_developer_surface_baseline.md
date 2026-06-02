# momso Developer Surface Baseline

상태: draft
작성일: 2026-06-02
작성자: Codex

## 한 줄 결론

momso는 6/12 제출용으로는 모바일 웹앱 데모를 먼저 완성한다. 그러나 선발 후 PoC를 위해 API, MCP, CLI로 확장될 수 있는 개발자 표면을 미리 설계한다.

이 문서는 실제 구현 완료 선언이 아니다. PoC에서 구현할 개발자 표면의 기준선이다.

## 왜 개발자 표면이 필요한가

momso가 단순 웹앱이 아니라 웰니스 수업 데이터의 기록/검수/공유 레이어가 되려면, 내부와 외부 도구가 안전하게 연결될 수 있어야 한다.

예상 연결 대상:

- 관리자용 웹앱
- 수련생용 리포트/아카이브
- Naver Login
- Naver Cloud Object Storage
- CLOVA Speech
- InBody 데이터 또는 결과지 업로드
- 강사/스튜디오 내부 운영 도구
- 사용자가 허용한 AI 도구

## 원칙

1. 원본 녹음은 기본 비공개다.
2. AI 초안은 자동 발행되지 않는다.
3. 강사가 공유 범위를 확정한다.
4. 수련생에게는 검수된 리포트만 공유한다.
5. 외부 연결은 수련생/수업 주체의 동의 이후에만 가능하다.
6. API, MCP, CLI는 모두 같은 데이터 상태 모델을 따른다.

## 공통 데이터 상태

| 상태 | 의미 |
|---|---|
| `draft` | AI가 만든 초안이며 강사가 아직 확정하지 않은 검토 대기 상태 |
| `shareable` | 수련생에게 공유 가능하도록 강사가 확정 |
| `internal` | 강사/요가원 내부 기록 |
| `hold` | 판단 보류 |
| `excluded` | 리포트에서 제외 |
| `published` | 수련생 리포트로 발행 완료 |

## 개발자 표면 1. API

API는 외부 서비스와 PoC 연동을 위한 HTTP 표면이다.

초기 후보:

```text
GET  /api/health
GET  /api/v1/classes/:classId
POST /api/v1/recordings/intake
POST /api/v1/transcripts/draft
GET  /api/v1/review-items?classId=:classId
PATCH /api/v1/review-items/:itemId
POST /api/v1/reports/publish
GET  /api/v1/reports/:reportId
GET  /api/v1/student-archive/:studentId
```

6/12 MVP에서 실제로 열어둘 API는 아직 없다. 제출자료에서는 "PoC에서 API 표면을 설계했다"까지만 말한다.

상세 초안:

```text
docs/development/api/20260602_api_v0_draft.md
```

## 개발자 표면 2. MCP

MCP는 AI 에이전트가 momso 기록을 안전하게 읽고 작업할 수 있게 하는 도구 표면이다.

초기 후보:

```text
momso.list_classes
momso.get_class_context
momso.list_review_items
momso.propose_review_status
momso.publish_report
momso.get_student_archive
```

중요한 제한:

- MCP는 원본 녹음 파일을 기본으로 읽지 않는다.
- AI는 공유 상태를 제안할 수 있지만, 최종 확정은 강사가 한다.
- 수련생 리포트 발행은 사람이 확인한 상태에서만 가능하다.

상세 초안:

```text
docs/development/mcp/20260602_mcp_tools_v0_draft.md
```

## 개발자 표면 3. CLI

CLI는 개발자/운영자가 PoC 데이터를 로컬에서 검증하고, 데모 상태를 점검하기 위한 도구다.

초기 후보:

```text
momso demo status
momso class inspect <class-id>
momso review list <class-id>
momso report preview <report-id>
momso report publish --dry-run <class-id>
momso smoke prototype
```

CLI는 운영 자동화보다 안전한 점검과 재현성을 우선한다.

상세 초안:

```text
docs/development/cli/20260602_cli_v0_draft.md
```

## 현재 구현 상태

| 표면 | 상태 | 메모 |
|---|---|---|
| 웹앱 `/prototype` | 구현 중 | 6/12 제출용 핵심 |
| API | 설계 초안 | 실제 엔드포인트 미구현 |
| MCP | 설계 초안 | 실제 서버 미구현 |
| CLI | 설계 초안 | 실제 명령 미구현 |
| Playwright smoke | 일부 수동 검증 | 자동 스크린샷 저장은 다음 작업 |

## 제출자료 표현

사용 가능:

- "작동형 모바일 웹앱 데모를 공개 URL로 제공합니다."
- "PoC 단계에서 API, MCP, CLI 표면을 확장할 수 있도록 데이터 상태와 권한 모델을 정리했습니다."
- "AI는 제안하고, 강사가 확정하며, 검수된 리포트만 공유됩니다."

피할 표현:

- "API가 이미 완성되어 있습니다."
- "MCP 서버가 이미 외부에 공개되어 있습니다."
- "CLI로 운영 자동화가 가능합니다."
- "원본 녹음이 외부 AI에 자동 제공됩니다."
