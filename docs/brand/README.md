# momso 브랜드 에셋 CI

> 이 문서는 momso 아이콘/심볼 체계의 **단일 원천(source of truth)** 이다.
> 앞으로 **모든** momso 앱·웹 디자인은 여기 정의된 아이콘과 **사용 규칙을 반드시 따른다.**
> 정의: 김성균(기술 공동창업자), 2026-06-22. — 소실 금지.
> 마스터 원본은 `docs/brand/assets/`에 있다. **항상 이 폴더를 정본으로 사용한다.**

---

## 1. 아이콘 체계

momso의 아이콘은 산스크리트/요가 용어로 명명되며, 각 아이콘은 **고정된 의미와 용도**를 가진다. 의미·용도를 임의로 바꾸지 않는다.

### 데이터 상태 — 음·양·합일 (해 / 달 / 소용돌이)
| 아이콘 | 문양 | 상징 | 용도 |
|---|---|---|---|
| **surya** (수리야) | 해 | 양(陽)의 기운 | 아직 **공유를 결정하지 않은 raw data** |
| **chandra** (찬드라) | 달 | 음(陰)의 기운 | **공유하지 않기로 결정한** 데이터 |
| **hatha** (하타) | 소용돌이 | 합일의 기운 (ha=해 + tha=달) | **공유 가능한(sharable)** 데이터 |

### 서비스 로고
| 아이콘 | 구성 | 용도 |
|---|---|---|
| **agar yoga** | antaranga + bahiranga | **몸소 서비스 아이콘 로고 (메인 로고)** |

### 프로세스
| 아이콘 | 상징 | 용도 |
|---|---|---|
| **bahiranga** (바히랑가) | **외면의 요가** · 수련 중의 모습 | 몸소의 **녹음 과정** |
| **antaranga** (안타랑가) | **내면의 요가** · 지식의 모습 | 몸소의 **검수 과정 (HITL)** |

### 기능
| 아이콘 | 상징 | 용도 |
|---|---|---|
| **astanga** (아쉬탕가) | 지식이 뻗어 나가는 모습 (나무) | 몸소 **AI Wiki** |
| **asana** (아사나) | 소통 | **소통** — AI를 통한 자신과의 대화(AI 대화 세션). 추후 베타 공유 기능에도 쓰일 여지. |

### 프로필
| 아이콘 | 대상 |
|---|---|
| **BigBlue** | 공동창업자 **유동환** |
| **Basoon** | 공동창업자 **김성균** |
| **agar** | **몸소 팀** (기획·개발·운영) |

---

## 2. 에셋 파일 매핑 (전 11시리즈 · 39개 — 모두 `docs/brand/assets/` 보유)

| 시리즈(CI) | 폴더 | 파일(변형) |
|---|---|---|
| surya | `assets/surya/` | 코랄본 / 투명 / 반대 (3) |
| chandra | `assets/chandra/` | 원본 / 반대 / 투명 (3) |
| hatha | `assets/hatha/` | 원본 / 반대 / 투명 (3) |
| **agar yoga** (메인 로고) | `assets/agar-yoga/` | 글씨제거(마크 단독) / 글씨제거+투명 / 반대 (3) |
| antaranga | `assets/antaranga/` | 원본 / 반대 / 투명 (3) |
| bahiranga | `assets/bahiranga/` | 원본 / 반대+투명 / 투명 (3) |
| astanga | `assets/astanga/` | 채움 / 윤곽(1·1.25·2·3pt) / 반대 (9) |
| asana | `assets/asana/` | 원본 / 투명 / 흰색 (3) |
| agar (팀) | `assets/agar/` | 반대 / 반대+투명 / 투명 (3) |
| BigBlue (유동환) | `assets/bigblue/` | 원본 / 반대+투명 / 투명 (3) |
| Basoon (김성균) | `assets/basoon/` | 원본 / 반대 / 투명 (3) |
| **wordmark-handwritten** (손글씨 워드마크) | `assets/wordmark-handwritten/` | 전체 락업 / 몸소(kr) / momso(en) (3) |

변형 약어 — **배경 제거**=투명 PNG · **반대 버전**=색 반전(어두운 바탕용) · **선 Npt**=윤곽선 굵기 · **글씨 제거**=워드마크 제거(마크 단독) · **흰색**=흰 버전.

파일명 규칙: `{시리즈}-{변형}.png` — 변형 토큰 `inverse`(반대)·`mark`(글씨 제거)·`white`(흰색)·`line-Npt`(선 굵기)·`transparent`(배경 제거)을 이 순서로 조합. 예: `surya.png`, `surya-inverse.png`, `astanga-inverse-line-2pt-transparent.png`, `agar-yoga-mark.png`(=앱 아이콘 소스).
앱 아이콘 빌드 산출물 → `apps/alpha/public/`: `icon-192.png`·`icon-512.png`(둥근 모서리) · `icon-512-maskable.png`·`apple-touch-icon.png`(불투명) · `favicon-32.png`.

---

## 3. 메인 로고 = agar yoga

`agar yoga`(= antaranga + bahiranga)가 몸소 서비스 **메인 아이콘 로고**다. `assets/agar-yoga/`에 보유(**글씨 제거** = 워드마크 없는 마크 단독본). surya/astanga/asana는 데이터 상태·기능 아이콘이지 메인 로고가 아니다.

> **앱 아이콘/파비콘**(`apps/alpha/public/icon-192·512·512-maskable`·`apple-touch-icon`·`favicon-32`)은 작은 크기 가독을 위해 **bahiranga 마크(코랄 #e26d5c 타일 + 흰 figure, 확대)** 를 사용한다(김성균 지시, 2026-06-22). `agar yoga`는 **로그인·사이드바 로고**(인앱 로고)로 유지한다 — 풀 로고 vs 단순 앱아이콘 분리.
> 캐시 무력화를 위해 매니페스트/메타의 아이콘 URL에 `?v=N` 버전 쿼리를 단다(아이콘 교체 시 N 증가).

---

## 4. 사용 규칙

1. **마스터 원본 편집 금지.** 항상 사본으로 작업한다. 다운로드 폴더 원본 사용 금지 — 이 폴더가 정본.
2. **변형 선택**: 맥락에 맞게 투명 / 반대(어두운 바탕) / 윤곽선 굵기를 고른다.
3. **채색**: 필요 시 momso 키컬러 팔레트(§5)에 맞춰 색을 조정한다.
4. **의미 고정**: 각 아이콘의 의미·용도는 §1 표를 벗어나 임의로 바꾸지 않는다.

---

## 5. 키컬러 팔레트 (`apps/alpha/app/globals.css` @theme 기준)

- 코랄 `#e26d5c` (주 액센트) · soft `#fbe8e3` · strong `#b0432f`
- 잉크 `#37352f` (본문) · muted `#787774`
- 네이비 `#1f3f5b` (무결성·출처 귀속 보조) · soft `#eef5fa`
- 세이지 `#edf1ed` · surface `#f7f7f7` · border `#e9e9e8`

---

## 6. 배너 (banner)

요가 동작 라인아트 프리즈(가로 띠) — 브랜드 마크와 같은 미니멀 라인 스타일.
- 마스터: `assets/banner/banner.jpg` (2000×965, 흰 배경 검정 라인)
- 웹용: `apps/alpha/public/brand/banner.png` — 여백 트림 + 잉크(`#37352f`) **잉크-온-투명** 재색(1855×188, 9.87:1)
- 용도: 여백이 큰 화면의 하단 풀폭 장식 띠. 현재 **로그인 화면 바닥**에 opacity 0.55로 배치(위쪽 sage 워시와 균형).

---

## 7. 손글씨 워드마크 (wordmark-handwritten)

손글씨로 적은 momso 타이포 워드마크. 발표 PPT용 원본 노트(Samsung Flow)에서 가져왔고, 원본은 연한 회색이라 **잉크(`#37352f`)로 재색 + 흰배경 투명** 처리했다(2026-06-29, 김성균 지시).

- `assets/wordmark-handwritten/wordmark-handwritten.png` — 전체 락업(몸소 + momso), 잉크-온-투명
- `…-kr.png` — 몸소(한글) · `…-en.png` — momso(영문) (원본 회색 스캔은 사설 레포에 보존)
- **기본 사용 = 전체 락업(몸소 + momso 같이).** 항상 붙여 쓴다(김성균 지시 2026-06-29 — "원래 넘겨준 대로 같이"). `…-kr`/`…-en` 분리본은 보관·특수용이며, 기본 배치에선 분리해 쓰지 않는다.
- 웹용: `apps/alpha/public/brand/wordmark-handwritten.png`(전체 락업). **표준 배치 = 저작권(`© …`) 문구 바로 앞에 같은 줄 인라인.** `Footer` 컴포넌트의 `mark` 슬롯으로 넘긴다(로그인 footer 적용; 사이드바 등 mark 미전달 시 표시 안 함). 앞으로 락업은 이 패턴으로 쓴다(김성균 지시 2026-06-29).
- ⚠️ 이건 **글자 락업(워드마크)**이라, 메인 아이콘 로고 `agar yoga`(글자 파생 아닌 독립 추상 심볼, §3)와 **별개 에셋**이다. 둘을 혼용하지 않는다.
