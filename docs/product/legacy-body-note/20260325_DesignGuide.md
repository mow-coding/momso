[Initial Created: 2026-03-25]
[Direction Status: Legacy Body Note visual guide. As of 2026-05-25, this guide applies only to the deferred Body Note sister product concept.]
[Last Modified: 2026-03-25 10:58]

\*\*디자인 철학:\*\* Functional Minimalism (Notion의 정갈함 + Medical의 정교함)



\---



\## 1. Brand Identity \& Visual Mood

\* \*\*Concept:\*\* 사용자가 3D 해부학 데이터와 기록에만 완벽히 몰입할 수 있도록 시각적 소음을 극도로 제한한다.

\* \*\*Tone \& Manner:\*\* 전문가용 정밀 기기 같은 차가운 정교함, 하지만 노션(Notion)처럼 친숙하고 군더더기 없는 인터페이스.



\---



\## 2. Design Tokens (공통 규격)



\### 2.1 Color Palette (Grayscale 중심)

\* \*\*Background (Primary):\*\* `#FFFFFF` (White) - 메인 워크스페이스 및 에디터 배경.

\* \*\*Background (Secondary):\*\* `#F7F7F7` (Soft Gray) - 사이드바 및 캔버스 배경.

\* \*\*Text (Main):\*\* `#37352F` (Notion Black) - 모든 본문 및 제목.

\* \*\*Text (Sub):\*\* `#787774` (Muted Gray) - 메타데이터 및 도움말.

\* \*\*Border:\*\* `#E9E9E8` (Light Gray) - 1px 실선 또는 여백으로 대체.

\* \*\*Point Accent:\*\* 흑백 UI와 대비되는 \*\*Vivid Neon Colors\*\* (오직 3D 레이어 전용).

&#x20;   \* `Muscle`: Red / `Nerve`: Yellow / `Meridian`: Cyan Blue 등.



\### 2.2 Typography

\* \*\*Main Font:\*\* `Inter`, `Apple SD Gothic Neo`, `Sans-serif` 시스템 폰트.

\* \*\*Data Font:\*\* `JetBrains Mono` 또는 `Roboto Mono` (수치 및 좌표 표시용).

\* \*\*Weight:\*\* Regular(400)를 기본으로 하되, 강조 시에만 Semi-bold(600) 사용.



\---



\## 3. Layout Strategy (Workspace Structure)



\### 3.1 Split-View 구성

전체 화면을 3개의 수직 섹션으로 분할하며, 섹션 간 경계는 최소화한다.

1\.  \*\*Left Sidebar (15-20%):\*\* 접이식(Collapsible). 쓰레드 리스트, 레이어 토글 마스터 버튼.

2\.  \*\*Center-Left (45-50%):\*\* 3D Viewport. 인체 모델이 부유하는 듯한 클린한 캔버스.

3\.  \*\*Center-Right (30-35%):\*\* Annotation Editor. 노션 스타일의 텍스트 에디터 영역.



\### 3.2 3D Viewport 스타일

\* 배경에 복잡한 Grid나 환경광(HDRI) 반사를 최소화하여 모델 자체의 가독성을 높임.

\* UI 오버레이(카메라 버튼, 타임라인 슬라이더)는 투명도 50%의 플랫한 디자인 채택.



\---



\## 4. Component Design Rules (The 'Notion' Feel)



\### 4.1 Buttons \& Interactive Elements

\* \*\*No Shadow:\*\* 그림자(Shadow)와 그라데이션(Gradient) 사용을 금지한다.

\* \*\*Hover State:\*\* 마우스를 올렸을 때 배경색이 `rgba(55, 53, 47, 0.08)`로 변하는 노션 스타일의 피드백을 적용한다.

\* \*\*Radius:\*\* 버튼과 입력창의 곡률은 `3px`\~`5px` 사이의 미세한 라운딩 처리.



\### 4.2 Annotation (B-type Callout)

\* \*\*Style:\*\* 흰색 배경에 아주 얇은 테두리가 있는 카드 형태.

\* \*\*Leader Line:\*\* 3D 모델의 앵커(Anchor) 지점과 메모를 잇는 지시선은 0.5px의 가는 실선으로 구현.

\* \*\*Opacity Interaction:\*\* 타임라인 프레임에 따라 투명도(0% \~ 100%)가 부드럽게 변함.



\---



\## 5. 7-Layer Visualization Guide



| 레이어 | 시각적 표현 방식 | 특징 |

| :--- | :--- | :--- |

| \*\*Physical (A/B)\*\* | 현실적 텍스처 + Semi-transparent | 해부학적 실체감 강조 |

| \*\*Mapping (C)\*\* | Neon Emissive Line / Point | 가상의 에너지 경로임을 시각적으로 암시 |

| \*\*Active State\*\* | High Saturation / Glow | 강조된 부위는 스스로 빛나는 듯한 효과 |

| \*\*Inactive State\*\* | Low Opacity (0.1\~0.2) | 배경처럼 연하게 처리하여 시야 확보 |



\---



\## 6. Codex(Cursor) Implementation Principles

1\.  \*\*Border-less First:\*\* 구분선을 긋기 전에 '여백(Padding)'으로 해결할 수 있는지 먼저 검토하라.

2\.  \*\*Flat by Default:\*\* 모든 UI 컴포넌트는 입체감이 없는 평면형으로 구축하라.

3\.  \*\*Anatomy Focus:\*\* 유채색은 오직 3D 해부학 레이어에만 허용된다. UI 버튼에 유채색을 쓰지 마라.



\---

