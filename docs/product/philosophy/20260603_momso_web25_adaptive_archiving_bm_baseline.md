# momso Web2.5 Adaptive Archiving and BM Baseline

상태: draft
작성일: 2026-06-03
작성자: Codex

## 한 줄 요약

momso는 사용자 데이터를 플랫폼이 소유하는 앱이 아니라, 요가원/원장님이 소유한 저장소와 AI 계정을 안전하게 운영하고, 각 요가원 고유의 기록 방식과 수업 언어를 발견해 다음 수업으로 되돌려주는 Web2.5 아카이빙 운영 플랫폼이다.

## 왜 이 문서가 필요한가

최근 논의에서 가장 중요한 질문은 다음이었다.

```text
원본 녹음과 요가원 지식 소스가 momso 서버가 아니라 원장님/요가원 계정의 저장소에 있다면,
momso는 단순 껍데기 아닌가?

사용자 소유 금고를 운영하는 구조에서 벤처형 J-커브가 가능한가?

그리고 momso가 하나의 메모법, 하나의 하네스, 하나의 리포트 양식을 강요하면
각 요가원의 고유한 세계와 색깔을 해치는 것 아닌가?
```

이 문서는 위 질문에 대한 제품/기술/BM 기준선을 남긴다.

## 결론

momso는 완전한 Web3.0 탈중앙화 제품이 아니다.

momso는 Web2.5 제품이다.

여기서 Web2.5란 다음을 뜻한다.

- 원본 데이터와 지식 소스는 고객에게 귀속된다.
- momso는 고객 데이터를 마음대로 소유하거나 잠그지 않는다.
- 하지만 고객이 혼자 클라우드, AI, 녹음, 전사, 권한, 동의, 리포트, 비용 관리를 모두 운영하는 것은 어렵다.
- 그래서 momso는 고객 소유 데이터 plane 위에 운영, 자동화, 권한, AI, 리포트, 비용 통제, 다음 수업 회수 흐름을 제공하는 control plane이 된다.

즉 momso는 데이터 소유 회사가 아니라, 사용자 소유 아카이브를 작동하게 만드는 운영 회사다.

## 발레파킹 비유

사용자가 말한 발레파킹 비유는 momso를 설명하는 데 매우 적절하다.

차는 고객 것이다.

차고지도 고객 것이다.

발레파킹 회사가 차를 소유하지 않는다.

그런데도 발레파킹 회사는 돈을 번다.

왜냐하면 고객은 차를 잃고 싶지 않지만, 동시에 주차 과정의 복잡함, 동선, 위험, 책임을 줄이고 싶어하기 때문이다.

momso도 같다.

- 원본 녹음은 원장님/요가원 것이다.
- 요가원 철학, 교재, 시퀀스, 용어집, 수업 메모도 요가원 것이다.
- 수련생 기록은 수련생과 요가원 사이의 동의와 권한 안에서만 다뤄져야 한다.
- momso는 그 자료를 가져가서 소유하는 회사가 아니다.
- momso는 그 자료가 안전하게 놓이고, 정리되고, 검색되고, 요약되고, 검수되고, 발행되고, 다음 수업에 다시 쓰이도록 운영하는 회사다.

따라서 momso가 받는 돈은 데이터 소유료가 아니다.

momso가 받는 돈은 다음 운영 가치에 대한 비용이다.

- 저장소 세팅
- 녹음/업로드 흐름
- 동의 UX
- 전사/요약 작업
- 강사 검수 워크플로우
- 개인 리포트 발행
- 다음 수업 맥락 회수
- 권한/철회/감사 로그
- AI 사용량/비용 통제
- 요가원별 기록 문법 학습

## 업계 구조와 비교

이 구조는 완전히 허황된 구조가 아니다.

최근 B2B SaaS와 데이터 인프라 영역에서는 control plane과 data plane을 분리하는 방식이 널리 쓰인다.

예를 들어 Fivetran Hybrid Deployment는 고객 데이터가 고객의 private network 안에 남고, Fivetran은 통합 control plane을 제공하는 방식으로 설명된다.

Union.ai BYOC/Self-managed 배포도 고객의 코드, 데이터, 이미지, 로그가 고객 cloud account의 data plane에 있고, Union.ai cloud의 control plane은 workflow orchestration logic을 제공한다고 설명한다.

Airbyte Enterprise Flex도 cloud control과 customer-controlled data plane을 결합해 민감 데이터가 고객 환경에 남도록 하는 구조를 설명한다.

momso가 바로 이 엔터프라이즈 구조를 복사한다는 뜻은 아니다.

다만 논리는 같다.

```text
민감한 데이터는 고객 쪽에 둔다.
복잡한 운영과 제품 경험은 플랫폼이 맡는다.
```

momso는 이 원리를 요가원, 필라테스 스튜디오, PT, 명상, 소매틱스 같은 스몰 웰니스 비즈니스에 맞게 낮추어 적용한다.

## momso의 control plane / data plane 구분

### 고객 소유 data plane

고객 소유 data plane은 원장님/요가원 계정에 귀속되는 영역이다.

초기 PoC 가설로는 Naver Login, 사업자 인증, Naver Cloud Object Storage를 중심으로 검토한다.

여기에 들어가는 자료:

- 원본 녹음 파일
- 업로드한 요가원 철학 문서
- 교재, 시퀀스, 수업 매뉴얼
- 원장님이 직접 작성한 메모
- 수련생 감각 기록 원본
- 발행 리포트의 원본 백업본
- 내보내기 가능한 workspace archive

원칙:

- 원본 음성 파일은 momso 회사 서버에 장기 보관하지 않는다.
- 원본 지식 소스도 momso가 소유하지 않는다.
- 고객은 언제든 자기 자료를 내보낼 수 있어야 한다.
- 고객이 momso를 떠나도 원본 자료는 고객에게 남아야 한다.

### momso control plane

momso control plane은 제품이 실제로 작동하게 만드는 운영 계층이다.

여기에 들어가는 것:

- 사용자/요가원/강사/수련생 권한
- 사업자 인증 상태
- 동의 상태
- object key와 업로드 세션
- AI 작업 큐
- 전사/요약 처리 상태
- 강사 검수 상태
- 리포트 발행 상태
- 요가원별 기록 문법 프로필
- 검색 색인과 retrieval 설정
- 비용/사용량 ledger
- 감사 로그

중요한 점:

momso control plane은 원본 데이터의 주인이 아니다.

momso control plane은 원본 데이터가 어디 있고, 누가 어떤 권한으로 어떤 작업을 할 수 있으며, 어떤 결과가 발행 가능한지 관리한다.

## 저장 위치 기준

| 데이터 | canonical owner | 기본 저장 위치 | momso 역할 |
|---|---|---|---|
| 원본 녹음 파일 | 원장님/요가원 | 요가원 귀속 Object Storage | 업로드 세션, object key, 전사 작업 관리 |
| 요가원 철학/교재/매뉴얼 원본 | 원장님/요가원 | 요가원 귀속 Object Storage | 텍스트 추출, 요약, 출처 연결 |
| 전사본 draft | 요가원 | momso DB 또는 고객 data plane의 정규화 저장소 | AI draft 생성, 검수 대기 |
| 요약/리포트 draft | 요가원 | momso DB | 강사 검수 전 초안 관리 |
| 발행 리포트 | 요가원/수련생 동의 범위 | momso DB + 고객 저장소 백업 | published 상태 관리, 공유 URL/API 제공 |
| 검색 색인/embedding | 운영상 momso 관리, 원본은 고객 소유 | vector DB 또는 Postgres pgvector | 다음 수업 RAG 검색 |
| 사용량/비용 기록 | momso 운영 장부 | momso DB | 과금, 예산 제한, 원가 추적 |

## 음성만이 아니다

momso는 음성 녹음 앱이 아니다.

음성은 입력 중 하나일 뿐이다.

momso가 다뤄야 하는 source material은 최소한 다음을 포함한다.

- 수업 녹음
- 수업 전사본
- 수업 요약 초안
- 강사 검수 기록
- 수련생 감각 메모
- 인바디/웨어러블 참고 지표
- 요가원 철학 문서
- 수업 교재
- 자세명/용어집
- 원장님이 자주 쓰는 표현
- 수업 시퀀스
- 금지 표현, 조심해야 하는 표현
- 업장별 리포트 스타일
- 지난 수업에서 다음 수업으로 이어지는 관찰 포인트

이 자료들이 모여 요가원 workspace knowledge base가 된다.

## 지식 단위

내부 사고를 위해 zettel-kasten 프로젝트의 `zet` 개념을 참고할 수 있다.

하지만 InBodyLIKE 제출자료나 심사자용 문서에서는 `zet`, `ZET`, `objet` 같은 내부 용어를 쓰지 않는다.

외부 제품 언어로는 다음처럼 부른다.

```text
검수된 수업 기록 단위
워크스페이스 지식 단위
다음 수업 연결 포인트
요가원 지식 소스
개인 수련 리포트
```

하나의 지식 단위는 대략 다음 정보를 가진다.

```text
id
workspace_id
owner_studio_id
source_refs
source_type
student_scope
visibility_status
review_status
title
summary
body
teacher_notes
student_safe_text
internal_only_text
next_class_hooks
term_review_flags
style_profile_id
created_by_ai
reviewed_by_teacher
published_at
embedding_refs
audit_log_refs
```

여기서 중요한 것은 AI가 만든다고 바로 지식이 되는 것이 아니라는 점이다.

AI 결과는 draft다.

강사가 검수하고 확정해야 momso의 정규 지식 단위가 된다.

## 다음 수업에 다시 쓰이는 흐름

momso의 핵심은 수업을 끝내고 리포트 하나를 발행하는 데서 멈추지 않는다.

검수된 기록은 다음 수업의 AI 흐름에 다시 들어가야 한다.

흐름:

```text
1. 수업 발생
2. 관리자 앱에서 녹음
3. 원본은 요가원 소유 Object Storage에 저장
4. STT가 전사
5. AI가 요약/분류 draft 생성
6. 강사가 검수
7. 검수된 지식 단위 발행
8. 수련생 리포트로 공유
9. 요가원 workspace knowledge base에 축적
10. 다음 수업 전 AI가 관련 지식 단위를 검색
11. 다음 수업 녹음/요약/리포트 생성에 반영
```

이것이 RAG이든, LLM wiki이든, 자체 retrieval engine이든, 중요한 제품 원칙은 같다.

```text
기록은 다음 수업으로 돌아와야 한다.
```

## momso는 하네스를 강요하면 안 된다

사용자가 강하게 지적한 원칙:

```text
momso만의 기록법, 메모법, 하네스 체계를 사용자에게 강요하면 안 된다.
```

이 원칙은 제품 철학에서 매우 중요하다.

요가원마다 세계가 다르다.

원장님마다 색깔이 다르다.

수업을 보는 눈, 말하는 방식, 기록을 남기는 방식, 수련생에게 전달하고 싶은 온도가 다르다.

따라서 momso는 "우리 템플릿대로 기록하세요"라고 말하면 안 된다.

momso는 다음처럼 작동해야 한다.

```text
원장님이 이미 가지고 있는 기록 방식과 수업 언어를 발견한다.
그 방식이 더 잘 보존되고 재사용되도록 돕는다.
필요한 경우 시작점이 되는 템플릿은 제공하지만, 템플릿을 정답으로 강요하지 않는다.
```

## 강의팔이 메모법과 반대로 가기

사용자가 싫어한다고 밝힌 것은 "누군가 자기만의 업무 효율 메모법을 정답처럼 팔아먹는 방식"이다.

momso는 그런 서비스가 되면 안 된다.

나쁜 제품 문장:

```text
이 방식으로 기록해야 좋은 수업 기록입니다.
이 템플릿을 따라야 AI가 잘 작동합니다.
momso의 하네스에 맞춰야 합니다.
```

momso가 지향해야 하는 문장:

```text
원장님이 이미 해오던 방식이 있습니다.
momso는 그 말투, 수업 리듬, 철학, 수련생을 보는 눈을 해치지 않습니다.
momso는 그 방식을 더 잘 남기고, 더 잘 꺼내 쓰게 돕습니다.
```

제품 원칙:

```text
방법론을 파는 서비스가 아니라,
각자의 방법을 발견하고 보존하는 서비스.
```

## Adaptive archiving

momso가 제공해야 하는 것은 고정 템플릿이 아니라 adaptive archiving이다.

adaptive archiving은 사용자의 기록 방식이 명시적으로 선언되지 않아도, 사용자의 선택과 수정 패턴을 통해 점점 그 사람에게 맞는 기록 방식을 찾아가는 구조다.

### 명시적 신호

사용자가 직접 알려주는 신호:

- 리포트 스타일 선택
- 공개 범위 선택
- "이 표현은 쓰지 않기"
- "이 용어는 이렇게 쓰기"
- "수련생에게는 부드럽게, 내부 기록은 구체적으로"
- 업로드한 교재/철학 문서
- 직접 만든 샘플 리포트

### 암묵적 신호

사용자가 직접 말하지 않아도 제품이 배울 수 있는 신호:

- AI 초안 중 어떤 항목을 공유로 확정하는가
- 어떤 항목을 내부 기록으로 돌리는가
- 어떤 표현을 매번 고치는가
- 어떤 요가 용어를 자주 수정하는가
- 리포트 길이를 줄이는가 늘리는가
- 감각 언어를 살리는가 데이터 표현을 살리는가
- 수련생 리포트에서는 어떤 톤을 선호하는가
- 다음 수업 포인트를 어떻게 바꾸는가

### 학습 결과

이 신호들은 요가원별 style memory로 저장된다.

style memory는 모델 학습 데이터가 아니라 workspace 안에서 쓰이는 운영 프로필이다.

예시:

```text
workspace_style_profile
- preferred_report_shape: narrative | checklist | mixed | data-first | sensation-first
- teacher_voice: warm | concise | philosophical | technical | coaching
- internal_note_density: low | medium | high
- student_report_density: low | medium | high
- preferred_terms
- forbidden_terms
- sensitive_topics
- default_visibility_rules
- next_class_hook_style
- examples_accepted_by_teacher
- examples_rejected_by_teacher
```

## AX 관점

여기서 AX는 AI Experience다.

momso의 AX는 "AI가 대단한 답을 해준다"가 아니다.

momso의 AX는 다음에 가깝다.

```text
사용자가 자기 방식을 완전히 설명하지 않아도,
AI가 사용자의 반복 선택, 말투, 수정, 보류, 발행 패턴을 읽고
점점 그 사용자에게 맞는 기록 운영자가 되는 경험.
```

이것이 LLM wiki와도 연결된다.

정적인 wiki가 아니라 살아있는 workspace wiki가 된다.

요가원 철학 문서, 교재, 수업 기록, 수련생 피드백, 강사 검수 이력이 계속 쌓이고, 다음 수업에서 다시 검색되고, 다시 정리된다.

## 비용과 AI 책임

AI 연산 비용은 반드시 명확해야 한다.

모호하게 "AI가 해준다"라고 말하면 안 된다.

### 기본 상용 모델

초기 상용 모델은 momso가 AI 비용을 먼저 부담하고, 고객에게 아래 방식으로 청구하는 것이 가장 현실적이다.

```text
월 구독료 + 포함 사용량 + 초과 사용량 과금
```

이유:

- 대부분의 요가원은 Naver Cloud, Anthropic, API key, billing 설정을 직접 다루기 어렵다.
- 처음부터 고객에게 AI 계정 연결을 요구하면 도입 장벽이 너무 높다.
- momso가 사용량을 묶어주고 예산을 관리해야 제품으로 느껴진다.

### BYOC / Sovereign 모델

프리미엄 고객이나 민감 데이터 고객은 자기 Naver Cloud 계정, Anthropic 계정, 또는 별도 AI 계정을 연결할 수 있게 한다.

이 경우:

- 원본 저장 비용은 고객 계정으로 나간다.
- AI 토큰/전사 비용도 고객 계정으로 나갈 수 있다.
- momso는 orchestration fee, workspace fee, support fee, compliance/reporting fee를 받는다.

### 두 모델을 함께 가져가는 이유

Basic/Pro 고객에게는 복잡도를 숨긴다.

Sovereign 고객에게는 데이터와 비용 통제권을 준다.

이 조합이 Web2.5스럽다.

완전한 탈중앙도 아니고, 완전한 플랫폼 종속도 아니다.

## BM 구조

momso의 BM은 데이터 소유료가 아니다.

momso의 BM은 운영 자동화, 신뢰, 비용 통제, 개인화된 기록 문법, 다음 수업 회수 흐름에서 나온다.

### 상품 층

| 상품 | 대상 | 과금 방향 | 핵심 가치 |
|---|---|---|---|
| Starter | 작은 요가원/강사 | 낮은 월 구독 + 제한 사용량 | 기본 녹음, 기본 리포트 |
| Studio Pro | 프리미엄 요가원/필라테스/PT | 월 15만~30만 원 + 사용량 | 검수 워크플로우, 리포트 자동화, 수련생 아카이브 |
| InBody Partner Package | InBodyLIKE PoC/프리미엄 업장 | 월 30만 원 이상 | 인바디 결과지/CSV/API 연동, 장비/세팅, 리포트 운영 |
| Sovereign Workspace | 데이터 주권 민감 고객 | 구독 + 운영 수수료 + BYOC 연결비 | 고객 소유 저장소/AI 계정 연동 |
| B2C Record Pass | 수련생 | 월 5천~7천 원 | 개인 수련 아카이브, 장기 리포트 |

### 추가 과금 항목

- 녹음/전사 시간 초과
- AI 요약/리포트 생성량 초과
- 저장 용량 초과
- 수련생 리포트 발행량
- 외부 AI/API 연결
- SNS/블로그 내보내기
- 요가원 지식 소스 초기 정리 패키지
- 고급 style memory 설정
- 파트너/프랜차이즈 대시보드

## J-커브가 가능한 이유

사용자 소유 저장소 구조가 곧바로 J-커브를 보장하지는 않는다.

오히려 잘못 만들면 "껍데기 앱"으로 보일 수 있다.

J-커브가 가능하려면 momso가 다음 자산을 가져야 한다.

### 1. 반복 가능한 control plane

한 요가원에서 만든 운영 흐름을 다른 요가원에도 반복 적용할 수 있어야 한다.

반복 가능한 것:

- 동의 UX
- 녹음/업로드 흐름
- STT 작업 큐
- AI draft 생성
- 강사 검수 화면
- 리포트 발행
- 수련생 아카이브
- 비용 ledger
- 권한/철회 로그

이 반복성이 매출 확장의 기초다.

### 2. 도메인별 starter pack

momso는 하네스를 강요하면 안 되지만, 시작점은 제공해야 한다.

예:

- 하타 요가 starter pack
- 프리미엄 소그룹 요가 starter pack
- 필라테스 starter pack
- PT starter pack
- 명상/소매틱스 starter pack

이것은 정답 템플릿이 아니라 초기 부트스트랩이다.

고객은 시작점에서 출발하되, 시간이 갈수록 자기 방식으로 바뀐다.

### 3. 고객별 style memory

단순 전사/요약 앱은 쉽게 대체된다.

하지만 한 요가원의 수업 언어, 리포트 톤, 검수 패턴, 다음 수업 연결 방식을 알고 있는 workspace는 쉽게 대체되지 않는다.

이것은 나쁜 의미의 데이터 락인이 아니다.

고객이 자기 자료를 내보낼 수 있어도, momso의 운영 경험이 계속 더 편하고 정확해지기 때문에 남는 것이다.

이를 context retention이라고 부를 수 있다.

### 4. 비용 통제

AI 비용은 제품이 성장할수록 같이 증가한다.

따라서 무제한 AI를 팔면 안 된다.

momso는 사용량과 비용을 투명하게 보여주고, 포함량과 초과 과금을 명확히 해야 한다.

이것이 gross margin 방어의 핵심이다.

### 5. B2B2C 확장

요가원 하나가 결제하고 끝나는 구조가 아니라, 요가원 안의 수련생 기록권이 붙어야 한다.

```text
요가원 월 구독료
+ 수련생 개인 기록권
+ 리포트 발행량
+ AI/전사 사용량
```

이 조합이 ARPA를 올린다.

## 투자자에게 설명하는 방식

### 나쁜 설명

```text
우리는 Web3.0 철학으로 사용자의 데이터를 돌려주는 앱입니다.
데이터는 전부 사용자 것이고 우리는 껍데기만 제공합니다.
```

이렇게 말하면 자선사업처럼 들릴 수 있다.

### 좋은 설명

```text
momso는 스몰 웰니스 사업자가 자기 데이터를 잃지 않으면서도 AI 기록 자동화를 쓸 수 있게 하는 Web2.5 운영 플랫폼입니다.
원본 데이터는 사업자 계정의 저장소에 두고, momso는 동의, 전사, 요약, 강사 검수, 리포트 발행, 다음 수업 맥락 회수, 사용량 과금 관리를 제공합니다.
```

### 더 짧은 설명

```text
데이터는 고객에게 남기고, 운영 복잡도는 momso가 흡수합니다.
```

### BM 설명

```text
momso는 저장소 소유료가 아니라 기록 운영 자동화 구독료, AI 사용량 관리 수수료, 리포트 발행량 기반 과금, 프리미엄 세팅 패키지로 수익을 냅니다.
```

### 철학과 BM을 연결하는 설명

```text
데이터 주권은 매출을 포기하는 철학이 아니라, 민감한 수업/신체 데이터를 다루는 고객이 momso를 믿고 결제할 수 있게 만드는 신뢰 인프라입니다.
```

## 제출자료에서 조심할 말

피해야 할 말:

- 완전한 Web3 SNS
- 모든 데이터가 사용자 네이버 저장소에 자동 저장됨
- momso는 데이터에 접근하지 않음
- Claude/CLOVA가 이미 완전 연동됨
- AI가 요가원 철학을 완전히 이해함
- 우리만의 기록법을 제공합니다
- 이 템플릿이 좋은 수업 기록의 정답입니다

써도 되는 말:

- Web2.5 방향의 사용자 귀속 저장소 구조를 PoC에서 검증합니다.
- 원본 녹음과 지식 소스는 요가원 계정에 귀속되는 저장소에 두는 방향을 검토합니다.
- momso는 동의, 전사, 검수, 발행, 비용 통제, 다음 수업 맥락 회수를 관리합니다.
- AI 초안은 자동 발행되지 않고, 강사가 검수합니다.
- 각 요가원의 수업 언어와 기록 방식을 학습하는 맞춤형 아카이빙을 지향합니다.
- 기본 템플릿은 시작점이며, 고객의 방식에 맞게 적응합니다.

## 제품 원칙

1. 원본은 고객에게 귀속한다.
2. momso는 원본을 소유하지 않고 운영한다.
3. AI는 초안을 제안하고, 강사가 확정한다.
4. 기록은 다음 수업으로 돌아와야 한다.
5. momso는 하나의 메모법을 강요하지 않는다.
6. 각 요가원의 기록 문법을 발견하고 보존한다.
7. 기본 템플릿은 정답이 아니라 시작점이다.
8. 수련생에게는 검수된 리포트만 발행한다.
9. 외부 AI/API/SNS 연결은 명시적 동의 후에만 가능하다.
10. AI 비용과 저장 비용은 workspace별로 추적한다.
11. 고객은 자기 자료를 내보낼 수 있어야 한다.
12. 고객을 가두는 락인이 아니라, 계속 쓰고 싶어지는 맥락 축적을 만든다.

## 기술 설계 과제

PoC 전에 구체화해야 할 것:

- Naver Login과 사업자 인증 흐름
- 요가원별 Object Storage bucket 또는 prefix 설계
- 원본 녹음 direct upload 방식
- 원본 파일 삭제/보관/철회 정책
- CLOVA Speech 전사 작업 흐름
- Claude/CLOVA Studio 요약 작업 흐름
- AI provider별 비용 ledger
- workspace별 budget cap
- RAG용 문서 chunking 전략
- pgvector 또는 별도 vector DB 선택
- row-level permission 기반 retrieval
- style memory schema
- 강사 검수 이력을 style memory에 반영하는 방식
- 고객별 export package
- BYOC/Sovereign 플랜에서 고객 API key를 안전하게 연결하는 방식

## 당장 프로토타입에 반영할 수 있는 표현

관리자 앱:

```text
momso는 요가원 고유의 수업 언어를 학습합니다.
AI 초안은 원장님의 기록 방식에 맞춰 제안되고, 최종 발행은 강사가 확정합니다.
```

수련생 앱:

```text
수련생에게는 원본 녹음이나 전체 전사본이 아니라, 강사가 검수한 개인 리포트만 공유됩니다.
```

투자자/심사자 설명:

```text
momso는 고객 데이터를 플랫폼에 가두지 않고, 고객 소유 저장소 위에서 작동하는 기록 운영 control plane을 제공합니다.
```

BM 설명:

```text
momso는 데이터 소유료가 아니라, 기록 운영 자동화와 AI 사용량 관리를 월 구독/사용량 기반으로 과금합니다.
```

## 외부 사례 메모

이 문서에서 참고한 외부 구조:

- Fivetran Hybrid Deployment: 고객 데이터가 고객 네트워크 안에 남고, Fivetran은 unified control plane을 제공하는 구조.
- Union.ai BYOC/Self-managed: data plane은 고객 cloud account에 있고, control plane은 workflow orchestration을 제공하는 구조.
- Airbyte Enterprise Flex: cloud control과 customer-controlled data plane을 결합하는 구조.
- Naver Cloud Object Storage: bucket과 S3 API 기반 object storage.
- CLOVA Speech Object Storage recognition: Object Storage에 업로드된 음성/영상 파일을 인식해 text로 변환하는 흐름.
- Anthropic API authentication: API key를 서버 환경변수 또는 `x-api-key` header로 사용하는 구조.
- Supabase RAG with Permissions: pgvector와 RLS를 이용해 권한 기반 retrieval을 구성하는 방식.
- Vercel AI Gateway: provider routing, fallback, authentication, BYOK, cost attribution 같은 AI 운영 계층 참고.

## 최종 기준 문장

momso는 사용자의 세계를 momso 양식에 집어넣는 앱이 아니다.

momso는 사용자의 세계와 색깔을 읽어내고, 그 사람이 이미 가진 수업 언어와 기록 방식을 더 잘 남기고 다시 꺼내 쓰게 해주는 Web2.5 아카이빙 운영체제다.

데이터는 고객에게 남긴다.

운영 복잡도는 momso가 흡수한다.

기록 방식은 강요하지 않는다.

각자의 기록 문법을 발견한다.

그 결과가 다음 수업과 장기 관계로 돌아오게 만든다.
