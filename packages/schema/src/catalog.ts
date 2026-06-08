export const authorityGradeValues = ['A', 'B', 'C'] as const

export const layerIdValues = [
  'skeleton',
  'muscle',
  'ligament',
  'nerve',
  'meridian',
  'acupoint',
  'myofascial_line',
] as const

export const inputModeValues = ['text', 'mic', 'hybrid'] as const

export const memoTypeValues = ['global', 'keyframed'] as const

export const layerCatalog = [
  {
    id: 'skeleton',
    label: 'Skeleton',
    authorityGrade: 'A',
    runtimeMode: 'dynamic_pose',
    accent: '#A8A29E',
    description: 'Verified structural baseline for the pose.',
  },
  {
    id: 'muscle',
    label: 'Muscle',
    authorityGrade: 'A',
    runtimeMode: 'dynamic_deform',
    accent: '#FF5C57',
    description: 'Verified dynamic deformation layer for muscular change.',
  },
  {
    id: 'ligament',
    label: 'Ligament',
    authorityGrade: 'B',
    runtimeMode: 'proxy_tension',
    accent: '#F59E0B',
    description: 'Estimated proxy tension rather than direct measurement.',
  },
  {
    id: 'nerve',
    label: 'Nerve',
    authorityGrade: 'B',
    runtimeMode: 'proxy_tension',
    accent: '#F2D14C',
    description: 'Estimated pathway and tension cue for neural structures.',
  },
  {
    id: 'meridian',
    label: 'Meridian',
    authorityGrade: 'C',
    runtimeMode: 'static_overlay',
    accent: '#2DD4E0',
    description: 'Traditional overlay displayed as a conceptual guide.',
  },
  {
    id: 'acupoint',
    label: 'Acupoint',
    authorityGrade: 'C',
    runtimeMode: 'static_overlay',
    accent: '#35A7FF',
    description: 'Traditional point marker displayed as a static overlay.',
  },
  {
    id: 'myofascial_line',
    label: 'Myofascial Line',
    authorityGrade: 'C',
    runtimeMode: 'static_overlay',
    accent: '#9FE870',
    description: 'Instructional line overlay instead of dynamic tissue simulation.',
  },
] as const

export const inputModeCatalog = [
  {
    id: 'text',
    label: 'Text',
    shortLabel: 'TXT',
    description: 'Write notes directly with the keyboard.',
  },
  {
    id: 'mic',
    label: 'Mic',
    shortLabel: 'MIC',
    description: 'Capture speech first, then confirm the transcript before saving.',
  },
  {
    id: 'hybrid',
    label: 'Hybrid',
    shortLabel: 'HYB',
    description: 'Switch between text and speech while staying in the same thread.',
  },
] as const

export const timelinePhases = [
  { id: 'setup', label: 'Setup', start: 0, end: 10 },
  { id: 'descent', label: 'Descent', start: 11, end: 54 },
  { id: 'bottom', label: 'Bottom', start: 55, end: 60 },
  { id: 'ascent', label: 'Ascent', start: 61, end: 100 },
] as const

export const canonicalFrameDomain = {
  min: 0,
  max: 100,
} as const
