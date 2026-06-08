import { anatomyRegistry, type RegistryBundle, type Vector3 } from '@momso/schema'

export interface ProxySceneSample {
  poseStrength: number
  anchorPositions: Record<string, Vector3>
  skeletonSegments: Array<{
    id: string
    start: Vector3
    end: Vector3
    radius: number
    color: string
  }>
  muscleSegments: Array<{
    id: string
    start: Vector3
    end: Vector3
    radius: number
    color: string
    opacity: number
  }>
  polylines: Record<string, Vector3[]>
  markers: Record<string, Vector3[]>
}

function pointFrom(origin: Vector3, length: number, angle: number): Vector3 {
  return {
    x: origin.x + Math.sin(angle) * length,
    y: origin.y - Math.cos(angle) * length,
    z: origin.z,
  }
}

export function sampleProxyScene(frame: number): ProxySceneSample {
  const clampedFrame = Math.max(0, Math.min(100, Math.round(frame)))
  const scrubProgress =
    clampedFrame <= 55 ? clampedFrame / 55 : 1 - (clampedFrame - 55) / 45
  const poseStrength = Math.max(0, Math.min(1, scrubProgress))
  const hipAngle = poseStrength * 0.62
  const kneeAngle = poseStrength * 1.2

  const pelvis = { x: 0.05, y: 0.35, z: 0 }
  const chest = { x: 0.12, y: 1.28 - poseStrength * 0.04, z: 0 }
  const neck = { x: 0.18, y: 1.72 - poseStrength * 0.06, z: 0 }
  const shoulder = { x: 0.26, y: 1.44 - poseStrength * 0.05, z: 0 }
  const hip = { x: 0.08, y: 0.18, z: 0 }
  const knee = pointFrom(hip, 0.95, hipAngle)
  const ankle = pointFrom(knee, 0.94, hipAngle - kneeAngle)
  const toe = { x: ankle.x + 0.32, y: ankle.y - 0.03, z: 0.06 }

  const ligamentPoints = [
    { x: knee.x - 0.12, y: knee.y + 0.12, z: 0.08 },
    { x: knee.x - 0.01, y: knee.y + 0.02, z: 0.08 },
    { x: knee.x + 0.12, y: knee.y - 0.18, z: 0.08 },
  ]

  const nervePoints = [
    { x: pelvis.x - 0.08, y: pelvis.y + 0.14, z: -0.04 },
    { x: hip.x - 0.16, y: hip.y - 0.16, z: -0.04 },
    { x: knee.x - 0.1, y: knee.y + 0.08, z: -0.03 },
    { x: ankle.x - 0.08, y: ankle.y + 0.16, z: -0.01 },
  ]

  const meridianPoints = [
    { x: chest.x + 0.16, y: chest.y - 0.22, z: 0.14 },
    { x: hip.x + 0.18, y: hip.y - 0.04, z: 0.16 },
    { x: knee.x + 0.12, y: knee.y - 0.1, z: 0.16 },
    { x: ankle.x + 0.05, y: ankle.y + 0.02, z: 0.12 },
  ]

  const myofascialPoints = [
    { x: shoulder.x - 0.18, y: shoulder.y + 0.12, z: 0.12 },
    { x: pelvis.x + 0.06, y: pelvis.y + 0.06, z: 0.12 },
    { x: knee.x + 0.18, y: knee.y - 0.12, z: 0.12 },
    { x: toe.x - 0.06, y: toe.y + 0.02, z: 0.12 },
  ]

  return {
    poseStrength,
    anchorPositions: {
      'anchor.pelvis.center': { x: pelvis.x, y: pelvis.y - 0.5, z: 0 },
      'anchor.femur.R.mid': {
        x: (hip.x + knee.x) / 2,
        y: (hip.y + knee.y) / 2 - 0.45,
        z: 0.03,
      },
      'anchor.hip.R.posterolateral': {
        x: hip.x - 0.05,
        y: hip.y - 0.35,
        z: 0.08,
      },
      'anchor.thigh.R.posterior': {
        x: (hip.x + knee.x) / 2 + 0.03,
        y: (hip.y + knee.y) / 2 - 0.4,
        z: 0.08,
      },
      'anchor.knee.R.anterior': {
        x: knee.x + 0.02,
        y: knee.y - 0.35,
        z: 0.08,
      },
      'anchor.nerve.sciatic.R': {
        x: nervePoints[1].x,
        y: nervePoints[1].y - 0.35,
        z: nervePoints[1].z,
      },
      'anchor.meridian.stomach.R': {
        x: meridianPoints[1].x,
        y: meridianPoints[1].y - 0.36,
        z: meridianPoints[1].z,
      },
      'anchor.acupoint.ST32.R': {
        x: meridianPoints[2].x,
        y: meridianPoints[2].y - 0.36,
        z: meridianPoints[2].z,
      },
      'anchor.line.superficial_back.R': {
        x: myofascialPoints[2].x,
        y: myofascialPoints[2].y - 0.36,
        z: myofascialPoints[2].z,
      },
      'anchor.ankle.R.lateral': {
        x: ankle.x + 0.02,
        y: ankle.y - 0.35,
        z: 0.04,
      },
    },
    skeletonSegments: [
      { id: 'skeleton-spine', start: pelvis, end: chest, radius: 0.1, color: '#A8A29E' },
      { id: 'skeleton-neck', start: chest, end: neck, radius: 0.07, color: '#A8A29E' },
      { id: 'skeleton-femur', start: hip, end: knee, radius: 0.06, color: '#8F8A83' },
      { id: 'skeleton-tibia', start: knee, end: ankle, radius: 0.055, color: '#8F8A83' },
      { id: 'skeleton-foot', start: ankle, end: toe, radius: 0.035, color: '#8F8A83' },
    ],
    muscleSegments: [
      {
        id: 'muscle-trunk',
        start: { x: pelvis.x - 0.05, y: pelvis.y + 0.02, z: 0.05 },
        end: { x: chest.x - 0.02, y: chest.y - 0.08, z: 0.05 },
        radius: 0.16,
        color: '#FF8A80',
        opacity: 0.54,
      },
      {
        id: 'muscle-glute',
        start: { x: hip.x + 0.04, y: hip.y - 0.02, z: 0.06 },
        end: { x: knee.x + 0.02, y: knee.y + 0.08, z: 0.06 },
        radius: 0.12,
        color: '#FF5C57',
        opacity: 0.56,
      },
      {
        id: 'muscle-calf',
        start: { x: knee.x + 0.02, y: knee.y - 0.04, z: 0.06 },
        end: { x: ankle.x + 0.02, y: ankle.y + 0.16, z: 0.06 },
        radius: 0.09,
        color: '#FF6A5F',
        opacity: 0.48,
      },
    ],
    polylines: {
      ligament: ligamentPoints,
      nerve: nervePoints,
      meridian: meridianPoints,
      myofascial_line: myofascialPoints,
    },
    markers: {
      acupoint: [meridianPoints[1], meridianPoints[2]],
    },
  }
}

export function getFocusPointForEntity(
  entityId: string,
  frame: number,
  registry: RegistryBundle = anatomyRegistry,
) {
  const entity = registry.entities.find((item) => item.id === entityId)

  if (!entity) {
    return null
  }

  const sample = sampleProxyScene(frame)
  return sample.anchorPositions[entity.anchorId] ?? null
}
