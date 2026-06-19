export type AuthorityGrade = 'A' | 'B' | 'C'

export type LayerId =
  | 'skeleton'
  | 'muscle'
  | 'ligament'
  | 'nerve'
  | 'meridian'
  | 'acupoint'
  | 'myofascial_line'

export type ThreadId =
  | 'thread.glute-hinge'
  | 'thread.knee-drive'
  | 'thread.meridian-context'

export type InputMode = 'text' | 'mic' | 'hybrid'

export interface LayerDefinition {
  id: LayerId
  label: string
  authority: AuthorityGrade
  runtimeMode: string
  description: string
  accent: string
}

export interface ThreadDefinition {
  id: ThreadId
  title: string
  memoMode: 'Global Memo' | 'Keyframed Memo'
  targetEntityId: string
  anchorId: string
  cameraViewId: string
  frameWindow: string
  summary: string
  body: string
  mentions: string[]
}

export const workspaceSummary = {
  productName: 'Body Note',
  projectName: 'MVP Workspace Initialization',
  actionInstance: 'Romanian Squat Teaching Clip',
  frameDomain: '0-100',
} as const

export const layerCatalog: LayerDefinition[] = [
  {
    id: 'skeleton',
    label: 'Skeleton',
    authority: 'A',
    runtimeMode: 'dynamic_pose',
    description: '뼈, 관절, 기준 좌표계를 담당하는 검증된 구조 레이어',
    accent: '#A8A29E',
  },
  {
    id: 'muscle',
    label: 'Muscle',
    authority: 'A',
    runtimeMode: 'dynamic_deform',
    description: '관절 각도와 근수축률에 반응하는 동적 근육 레이어',
    accent: '#FF5C57',
  },
  {
    id: 'ligament',
    label: 'Ligament',
    authority: 'B',
    runtimeMode: 'proxy_tension',
    description: '실측이 아닌 프록시 텐션으로 표현되는 인대 레이어',
    accent: '#F59E0B',
  },
  {
    id: 'nerve',
    label: 'Nerve',
    authority: 'B',
    runtimeMode: 'proxy_tension',
    description: '압박 및 경로 길이 변화를 추정하는 신경 레이어',
    accent: '#F2D14C',
  },
  {
    id: 'meridian',
    label: 'Meridian',
    authority: 'C',
    runtimeMode: 'static_overlay',
    description: '정적 경락 오버레이로만 존재하는 개념 레이어',
    accent: '#2DD4E0',
  },
  {
    id: 'acupoint',
    label: 'Acupoint',
    authority: 'C',
    runtimeMode: 'static_overlay',
    description: '앵커 기반 포인트 마커로 표시되는 경혈 레이어',
    accent: '#35A7FF',
  },
  {
    id: 'myofascial_line',
    label: 'Myofascial Line',
    authority: 'C',
    runtimeMode: 'static_overlay',
    description: '교육용 정적 라인으로만 보이는 근막 경선 레이어',
    accent: '#9FE870',
  },
]

export const threadCatalog: ThreadDefinition[] = [
  {
    id: 'thread.glute-hinge',
    title: 'Hip Hinge Cue',
    memoMode: 'Global Memo',
    targetEntityId: 'muscle.gluteus_maximus.R',
    anchorId: 'anchor.hip.R.posterolateral',
    cameraViewId: 'cam.body.left45',
    frameWindow: '0-100',
    summary: '골반 과전방경사를 피하고 둔근 우선 설명을 유지합니다.',
    body:
      '골반 과전방경사를 피하고 @muscle.gluteus_maximus.R 를 우선 설명합니다.\n\n학습 포인트\n- 내려갈수록 골반이 접히는 방향을 먼저 읽습니다.\n- 햄스트링은 보조 설명으로 두고, 둔근 cue를 중심으로 유지합니다.\n- Type B 콜아웃은 anchor.hip.R.posterolateral 기준으로 화면 우측에 고정합니다.',
    mentions: ['@muscle.gluteus_maximus.R', '@muscle.biceps_femoris_long_head.R'],
  },
  {
    id: 'thread.knee-drive',
    title: 'Bottom Frame Load',
    memoMode: 'Keyframed Memo',
    targetEntityId: 'ligament.patellar.R',
    anchorId: 'anchor.knee.R.anterior',
    cameraViewId: 'cam.body.left45',
    frameWindow: '48-70',
    summary: '하강 말기 프레임에서 무릎 전방 텐션과 발목 정렬을 묶어 설명합니다.',
    body:
      '48-70 프레임 구간에서는 @ligament.patellar.R 의 프록시 텐션을 강조합니다.\n\n확인 체크리스트\n- B 등급 값은 측정값처럼 말하지 않습니다.\n- 무릎이 발끝보다 과하게 전진하는지 시각적으로만 비교합니다.\n- 바닥 반력 설명은 다음 단계 구현으로 미룹니다.',
    mentions: ['@ligament.patellar.R', '@joint.ankle.R'],
  },
  {
    id: 'thread.meridian-context',
    title: 'Meridian Overlay Note',
    memoMode: 'Global Memo',
    targetEntityId: 'meridian.stomach.R',
    anchorId: 'anchor.acupoint.ST32.R',
    cameraViewId: 'cam.body.left45',
    frameWindow: '0-100',
    summary: '경락/경혈은 오버레이라는 사실을 명확히 드러내는 교육 노트입니다.',
    body:
      'C 레이어는 해부학 계산을 역으로 구동하지 않는 정적 오버레이입니다.\n\n강의 메모\n- @meridian.stomach.R 는 Traditional Overlay 배지와 함께 보여 줍니다.\n- @acupoint.ST32.R 는 설명용 포인트로만 사용합니다.\n- 활성화라는 표현 대신 overlay라는 표현을 고정합니다.',
    mentions: ['@meridian.stomach.R', '@acupoint.ST32.R'],
  },
]

export const inputModeCatalog: Array<{
  id: InputMode
  label: string
  shortLabel: string
  description: string
}> = [
  {
    id: 'text',
    label: 'Text',
    shortLabel: 'TXT',
    description: '키보드 기반 입력에 집중하는 기본 모드',
  },
  {
    id: 'mic',
    label: 'Mic',
    shortLabel: 'MIC',
    description: '음성 메모를 우선으로 시작하는 모드',
  },
  {
    id: 'hybrid',
    label: 'Hybrid',
    shortLabel: 'HYB',
    description: '텍스트와 음성을 함께 쓰는 권장 모드',
  },
]

export const phaseCatalog = [
  { id: 'setup', label: 'Setup', start: 0, end: 10 },
  { id: 'descent', label: 'Descent', start: 10, end: 55 },
  { id: 'bottom', label: 'Bottom', start: 55, end: 60 },
  { id: 'ascent', label: 'Ascent', start: 60, end: 100 },
] as const

export function getPhaseLabel(frame: number) {
  const activePhase =
    phaseCatalog.find((phase) => frame >= phase.start && frame <= phase.end) ??
    phaseCatalog[phaseCatalog.length - 1]

  return activePhase.label
}
