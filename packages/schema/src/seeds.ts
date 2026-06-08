import { canonicalFrameDomain, layerCatalog } from './catalog'
import type {
  ActionFamily,
  ActionInstance,
  CameraView,
  Project,
  ProjectSettings,
  RegistryBundle,
  Thread,
  ThreadMemo,
  WorkspaceSnapshot,
} from './models'

function createId() {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `fallback-${Math.random().toString(36).slice(2, 10)}`
  )
}

function isoNow() {
  return new Date().toISOString()
}

export const anatomyRegistry: RegistryBundle = {
  entities: [
    {
      id: 'skeleton.pelvis',
      label: 'Pelvis',
      layerId: 'skeleton',
      authorityGrade: 'A',
      description: 'Primary skeletal landmark for hip orientation.',
      anchorId: 'anchor.pelvis.center',
      aliases: ['pelvis', 'hip-basin'],
      displayColor: '#A8A29E',
      focusRadius: 0.28,
    },
    {
      id: 'skeleton.femur.R',
      label: 'Right Femur',
      layerId: 'skeleton',
      authorityGrade: 'A',
      description: 'Right femur axis used for lower-limb alignment.',
      anchorId: 'anchor.femur.R.mid',
      aliases: ['right-femur', 'femur-r'],
      displayColor: '#8F8A83',
      focusRadius: 0.24,
    },
    {
      id: 'muscle.gluteus_maximus.R',
      label: 'Right Gluteus Maximus',
      layerId: 'muscle',
      authorityGrade: 'A',
      description: 'Primary hip extension driver in the teaching clip.',
      anchorId: 'anchor.hip.R.posterolateral',
      aliases: ['glute', 'glute-max', 'gluteus-maximus'],
      displayColor: '#FF5C57',
      focusRadius: 0.26,
    },
    {
      id: 'muscle.biceps_femoris_long_head.R',
      label: 'Right Biceps Femoris Long Head',
      layerId: 'muscle',
      authorityGrade: 'A',
      description: 'Posterior chain companion for the hinge cue.',
      anchorId: 'anchor.thigh.R.posterior',
      aliases: ['hamstring', 'biceps-femoris', 'posterior-chain'],
      displayColor: '#FF8A80',
      focusRadius: 0.24,
    },
    {
      id: 'ligament.patellar.R',
      label: 'Right Patellar Ligament',
      layerId: 'ligament',
      authorityGrade: 'B',
      description: 'Proxy tension cue for the anterior knee.',
      anchorId: 'anchor.knee.R.anterior',
      aliases: ['patellar', 'knee-front', 'patellar-ligament'],
      displayColor: '#F59E0B',
      focusRadius: 0.2,
    },
    {
      id: 'nerve.sciatic.R',
      label: 'Right Sciatic Nerve',
      layerId: 'nerve',
      authorityGrade: 'B',
      description: 'Estimated path used for neural tension explanation.',
      anchorId: 'anchor.nerve.sciatic.R',
      aliases: ['sciatic', 'nerve', 'neural-tension'],
      displayColor: '#F2D14C',
      focusRadius: 0.2,
    },
    {
      id: 'meridian.stomach.R',
      label: 'Right Stomach Meridian',
      layerId: 'meridian',
      authorityGrade: 'C',
      description: 'Traditional overlay used for educational context.',
      anchorId: 'anchor.meridian.stomach.R',
      aliases: ['stomach-meridian', 'st-meridian'],
      displayColor: '#2DD4E0',
      focusRadius: 0.18,
    },
    {
      id: 'acupoint.ST32.R',
      label: 'Right ST32',
      layerId: 'acupoint',
      authorityGrade: 'C',
      description: 'Traditional acupoint marker displayed as an overlay.',
      anchorId: 'anchor.acupoint.ST32.R',
      aliases: ['st32', 'acupoint-st32'],
      displayColor: '#35A7FF',
      focusRadius: 0.16,
    },
    {
      id: 'myofascial_line.superficial_back.R',
      label: 'Right Superficial Back Line',
      layerId: 'myofascial_line',
      authorityGrade: 'C',
      description: 'Instructional line for posterior chain continuity.',
      anchorId: 'anchor.line.superficial_back.R',
      aliases: ['back-line', 'myofascial', 'superficial-back-line'],
      displayColor: '#9FE870',
      focusRadius: 0.2,
    },
    {
      id: 'joint.ankle.R',
      label: 'Right Ankle Joint',
      layerId: 'skeleton',
      authorityGrade: 'A',
      description: 'Distal alignment reference for the bottom phase.',
      anchorId: 'anchor.ankle.R.lateral',
      aliases: ['ankle', 'ankle-joint', 'right-ankle'],
      displayColor: '#8F8A83',
      focusRadius: 0.18,
    },
  ],
  anchors: [
    {
      id: 'anchor.pelvis.center',
      label: 'Pelvis Center',
      entityId: 'skeleton.pelvis',
      position: { x: 0.05, y: -0.15, z: 0 },
      cameraViewId: 'cam.body.hipClose',
    },
    {
      id: 'anchor.femur.R.mid',
      label: 'Right Femur Midpoint',
      entityId: 'skeleton.femur.R',
      position: { x: 0.15, y: -0.75, z: 0.03 },
      cameraViewId: 'cam.body.left45',
    },
    {
      id: 'anchor.hip.R.posterolateral',
      label: 'Posterolateral Hip',
      entityId: 'muscle.gluteus_maximus.R',
      position: { x: 0.03, y: -0.1, z: 0.08 },
      cameraViewId: 'cam.body.hipClose',
    },
    {
      id: 'anchor.thigh.R.posterior',
      label: 'Posterior Thigh',
      entityId: 'muscle.biceps_femoris_long_head.R',
      position: { x: 0.12, y: -0.62, z: 0.08 },
      cameraViewId: 'cam.body.hipClose',
    },
    {
      id: 'anchor.knee.R.anterior',
      label: 'Anterior Knee',
      entityId: 'ligament.patellar.R',
      position: { x: 0.22, y: -1.2, z: 0.08 },
      cameraViewId: 'cam.body.kneeClose',
    },
    {
      id: 'anchor.nerve.sciatic.R',
      label: 'Sciatic Path',
      entityId: 'nerve.sciatic.R',
      position: { x: -0.04, y: -0.62, z: -0.04 },
      cameraViewId: 'cam.body.left45',
    },
    {
      id: 'anchor.meridian.stomach.R',
      label: 'Stomach Meridian Path',
      entityId: 'meridian.stomach.R',
      position: { x: 0.24, y: -0.4, z: 0.16 },
      cameraViewId: 'cam.body.left45',
    },
    {
      id: 'anchor.acupoint.ST32.R',
      label: 'Acupoint ST32',
      entityId: 'acupoint.ST32.R',
      position: { x: 0.22, y: -0.74, z: 0.16 },
      cameraViewId: 'cam.body.kneeClose',
    },
    {
      id: 'anchor.line.superficial_back.R',
      label: 'Superficial Back Line',
      entityId: 'myofascial_line.superficial_back.R',
      position: { x: 0.26, y: -0.82, z: 0.12 },
      cameraViewId: 'cam.body.left45',
    },
    {
      id: 'anchor.ankle.R.lateral',
      label: 'Right Lateral Ankle',
      entityId: 'joint.ankle.R',
      position: { x: 0.46, y: -2.08, z: 0.04 },
      cameraViewId: 'cam.body.kneeClose',
    },
  ],
  cameraViews: [
    {
      id: 'cam.body.left45',
      label: 'Left 45',
      position: { x: 2.6, y: 1.1, z: 2.7 },
      target: { x: 0.08, y: -0.6, z: 0.02 },
    },
    {
      id: 'cam.body.hipClose',
      label: 'Hip Close',
      position: { x: 1.55, y: 0.55, z: 1.4 },
      target: { x: 0.04, y: -0.2, z: 0.08 },
    },
    {
      id: 'cam.body.kneeClose',
      label: 'Knee Close',
      position: { x: 1.55, y: -0.65, z: 1.38 },
      target: { x: 0.24, y: -1.22, z: 0.06 },
    },
  ] satisfies CameraView[],
}

export function getRegistryEntity(entityId: string) {
  return anatomyRegistry.entities.find((entity) => entity.id === entityId) ?? null
}

export function getRegistryAnchor(anchorId: string) {
  return anatomyRegistry.anchors.find((anchor) => anchor.id === anchorId) ?? null
}

export function getCameraView(cameraViewId: string) {
  return (
    anatomyRegistry.cameraViews.find((view) => view.id === cameraViewId) ?? null
  )
}

export function createStarterWorkspace(
  userId: string,
  options?: {
    projectTitle?: string
    projectDescription?: string
    inputMode?: ProjectSettings['inputMode']
  },
): WorkspaceSnapshot {
  const now = isoNow()
  const projectId = createId()
  const actionFamilyId = createId()
  const actionInstanceId = createId()

  const project: Project = {
    id: projectId,
    userId,
    title: options?.projectTitle ?? 'momso Alpha Workspace',
    description:
      options?.projectDescription ??
      'Cloud workspace foundation for momso while the Body Note prototype stays parked.',
    activeActionFamilyId: actionFamilyId,
    activeActionInstanceId: actionInstanceId,
    defaultCameraViewId: 'cam.body.left45',
    createdAt: now,
    updatedAt: now,
  }

  const layerDefaults = layerCatalog.map((layer) => ({
    layerId: layer.id,
    visible: true,
    emphasis: layer.id === 'skeleton' ? 0.72 : 0.46,
    opacity: layer.id === 'muscle' ? 0.6 : 0.92,
  }))

  const actionFamily: ActionFamily = {
    id: actionFamilyId,
    projectId,
    slug: 'romanian-squat',
    title: 'Body Note Prototype Family',
    description:
      'Parked 3D anatomy prototype data kept as a sandbox for the future Body Note product.',
    frameCount: canonicalFrameDomain.max - canonicalFrameDomain.min + 1,
    defaultCameraViewId: 'cam.body.left45',
    layerDefaults,
    cues: [
      {
        id: 'cue.family.setup',
        label: 'Setup',
        range: { start: 0, end: 10 },
        focusEntityIds: ['skeleton.pelvis', 'muscle.gluteus_maximus.R'],
        layerEmphasis: [
          { layerId: 'skeleton', emphasis: 0.82 },
          { layerId: 'muscle', emphasis: 0.74 },
        ],
        cameraViewId: 'cam.body.left45',
      },
      {
        id: 'cue.family.descent',
        label: 'Descent',
        range: { start: 11, end: 54 },
        focusEntityIds: [
          'muscle.gluteus_maximus.R',
          'muscle.biceps_femoris_long_head.R',
        ],
        layerEmphasis: [
          { layerId: 'muscle', emphasis: 0.92 },
          { layerId: 'myofascial_line', emphasis: 0.66 },
        ],
        cameraViewId: 'cam.body.hipClose',
      },
      {
        id: 'cue.family.bottom',
        label: 'Bottom',
        range: { start: 55, end: 60 },
        focusEntityIds: ['ligament.patellar.R', 'joint.ankle.R'],
        layerEmphasis: [
          { layerId: 'ligament', emphasis: 0.94 },
          { layerId: 'skeleton', emphasis: 0.78 },
        ],
        cameraViewId: 'cam.body.kneeClose',
      },
      {
        id: 'cue.family.ascent',
        label: 'Ascent',
        range: { start: 61, end: 100 },
        focusEntityIds: ['muscle.gluteus_maximus.R', 'nerve.sciatic.R'],
        layerEmphasis: [
          { layerId: 'muscle', emphasis: 0.88 },
          { layerId: 'nerve', emphasis: 0.58 },
        ],
        cameraViewId: 'cam.body.left45',
      },
    ],
    createdAt: now,
    updatedAt: now,
  }

  const actionInstance: ActionInstance = {
    id: actionInstanceId,
    projectId,
    familyId: actionFamilyId,
    title: 'Body Note Prototype Clip',
    description:
      'Temporary prototype emphasis preserved while momso product planning moves forward.',
    frameCount: actionFamily.frameCount,
    layerOverrides: [
      { layerId: 'ligament', visible: true, emphasis: 0.52, opacity: 0.9 },
      { layerId: 'meridian', visible: true, emphasis: 0.38, opacity: 0.88 },
    ],
    cueOverrides: [
      {
        id: 'cue.instance.bottom-knee-drive',
        label: 'Bottom Knee Drive',
        range: { start: 48, end: 70 },
        focusEntityIds: ['ligament.patellar.R', 'joint.ankle.R'],
        layerEmphasis: [
          { layerId: 'ligament', emphasis: 0.98 },
          { layerId: 'acupoint', emphasis: 0.62 },
        ],
        cameraViewId: 'cam.body.kneeClose',
      },
    ],
    createdAt: now,
    updatedAt: now,
  }

  const threadGluteId = createId()
  const threadKneeId = createId()
  const threadMeridianId = createId()

  const threads: Thread[] = [
    {
      id: threadGluteId,
      projectId,
      actionInstanceId,
      title: 'Hip Hinge Cue',
      summary: 'Keep the pelvis organized while cueing the right glute path.',
      targetEntityId: 'muscle.gluteus_maximus.R',
      anchorId: 'anchor.hip.R.posterolateral',
      cameraViewId: 'cam.body.hipClose',
      frameStart: 0,
      frameEnd: 100,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: threadKneeId,
      projectId,
      actionInstanceId,
      title: 'Bottom Frame Load',
      summary: 'Track anterior knee load and ankle stacking through the bottom phase.',
      targetEntityId: 'ligament.patellar.R',
      anchorId: 'anchor.knee.R.anterior',
      cameraViewId: 'cam.body.kneeClose',
      frameStart: 48,
      frameEnd: 70,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: threadMeridianId,
      projectId,
      actionInstanceId,
      title: 'Meridian Overlay Note',
      summary: 'Label the traditional overlay as instructional context only.',
      targetEntityId: 'meridian.stomach.R',
      anchorId: 'anchor.meridian.stomach.R',
      cameraViewId: 'cam.body.left45',
      frameStart: 0,
      frameEnd: 100,
      createdAt: now,
      updatedAt: now,
    },
  ]

  const memos: ThreadMemo[] = [
    {
      id: createId(),
      projectId,
      threadId: threadGluteId,
      memoType: 'global',
      frame: null,
      body:
        'Use @muscle.gluteus_maximus.R as the primary hip extension cue and keep @muscle.biceps_femoris_long_head.R as the posterior-chain support note.',
      mentions: [
        {
          token: '@muscle.gluteus_maximus.R',
          entityId: 'muscle.gluteus_maximus.R',
          label: 'Right Gluteus Maximus',
          anchorId: 'anchor.hip.R.posterolateral',
          start: 4,
          end: 29,
        },
        {
          token: '@muscle.biceps_femoris_long_head.R',
          entityId: 'muscle.biceps_femoris_long_head.R',
          label: 'Right Biceps Femoris Long Head',
          anchorId: 'anchor.thigh.R.posterior',
          start: 74,
          end: 110,
        },
      ],
      transcriptSource: null,
      transcriptReviewed: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: createId(),
      projectId,
      threadId: threadKneeId,
      memoType: 'keyframed',
      frame: 58,
      body:
        'At the bottom phase, keep @ligament.patellar.R and @joint.ankle.R aligned before cueing ascent.',
      mentions: [
        {
          token: '@ligament.patellar.R',
          entityId: 'ligament.patellar.R',
          label: 'Right Patellar Ligament',
          anchorId: 'anchor.knee.R.anterior',
          start: 26,
          end: 47,
        },
        {
          token: '@joint.ankle.R',
          entityId: 'joint.ankle.R',
          label: 'Right Ankle Joint',
          anchorId: 'anchor.ankle.R.lateral',
          start: 52,
          end: 66,
        },
      ],
      transcriptSource: null,
      transcriptReviewed: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: createId(),
      projectId,
      threadId: threadMeridianId,
      memoType: 'global',
      frame: null,
      body:
        'Mark @meridian.stomach.R and @acupoint.ST32.R as instructional overlays only. They are not promoted to measured anatomy.',
      mentions: [
        {
          token: '@meridian.stomach.R',
          entityId: 'meridian.stomach.R',
          label: 'Right Stomach Meridian',
          anchorId: 'anchor.meridian.stomach.R',
          start: 5,
          end: 24,
        },
        {
          token: '@acupoint.ST32.R',
          entityId: 'acupoint.ST32.R',
          label: 'Right ST32',
          anchorId: 'anchor.acupoint.ST32.R',
          start: 29,
          end: 45,
        },
      ],
      transcriptSource: null,
      transcriptReviewed: false,
      createdAt: now,
      updatedAt: now,
    },
  ]

  const settings: ProjectSettings = {
    projectId,
    inputMode: options?.inputMode ?? 'hybrid',
    selectedAudioInputDeviceId: null,
    saveRawAudio: false,
    lastOpenedFrame: 24,
    lastSelectedThreadId: threadGluteId,
    lastSelectedEntityId: 'muscle.gluteus_maximus.R',
    updatedAt: now,
  }

  return {
    project,
    actionFamily,
    actionInstance,
    settings,
    threads,
    memos,
    registry: anatomyRegistry,
  }
}
