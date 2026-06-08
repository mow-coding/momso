import {
  canonicalFrameDomain,
  layerCatalog,
  timelinePhases,
  type FrameCue,
  type LayerProfile,
  type ResolvedFrameState,
  type WorkspaceSnapshot,
} from '@momso/schema'

function clampFrame(frame: number) {
  return Math.max(
    canonicalFrameDomain.min,
    Math.min(canonicalFrameDomain.max, Math.round(frame)),
  )
}

function resolvePhaseLabel(frame: number) {
  return (
    timelinePhases.find((phase) => frame >= phase.start && frame <= phase.end)?.label ??
    timelinePhases[timelinePhases.length - 1].label
  )
}

function mergeLayerProfiles(
  familyLayerDefaults: LayerProfile[],
  instanceLayerOverrides: LayerProfile[],
) {
  return layerCatalog.map((layer) => {
    const familyProfile =
      familyLayerDefaults.find((profile) => profile.layerId === layer.id) ?? null
    const instanceProfile =
      instanceLayerOverrides.find((profile) => profile.layerId === layer.id) ?? null
    const emphasis = instanceProfile?.emphasis ?? familyProfile?.emphasis ?? 0.46
    const opacity = instanceProfile?.opacity ?? familyProfile?.opacity ?? 0.92
    const visible = instanceProfile?.visible ?? familyProfile?.visible ?? true

    return {
      layerId: layer.id,
      label: layer.label,
      authorityGrade: layer.authorityGrade,
      runtimeMode: layer.runtimeMode,
      accent: layer.accent,
      visible,
      emphasis,
      opacity,
    }
  })
}

function resolveCueEmphasis(cues: FrameCue[], layerId: string) {
  return cues.reduce((currentMax, cue) => {
    const emphasis = cue.layerEmphasis.find((entry) => entry.layerId === layerId)
    return Math.max(currentMax, emphasis?.emphasis ?? 0)
  }, 0)
}

export function resolveRuntimeFrame(
  workspace: WorkspaceSnapshot,
  frame: number,
): ResolvedFrameState {
  const clampedFrame = clampFrame(frame)
  const activeFamilyCues = workspace.actionFamily.cues.filter(
    (cue) => clampedFrame >= cue.range.start && clampedFrame <= cue.range.end,
  )
  const activeInstanceCues = workspace.actionInstance.cueOverrides.filter(
    (cue) => clampedFrame >= cue.range.start && clampedFrame <= cue.range.end,
  )
  const mergedProfiles = mergeLayerProfiles(
    workspace.actionFamily.layerDefaults,
    workspace.actionInstance.layerOverrides,
  )
  const cues = [...activeFamilyCues, ...activeInstanceCues]
  const cameraViewId =
    [...activeInstanceCues].reverse().find((cue) => cue.cameraViewId)?.cameraViewId ??
    [...activeFamilyCues].reverse().find((cue) => cue.cameraViewId)?.cameraViewId ??
    workspace.actionFamily.defaultCameraViewId
  const focusEntityIds = Array.from(new Set(cues.flatMap((cue) => cue.focusEntityIds)))

  return {
    frame: clampedFrame,
    phaseLabel: resolvePhaseLabel(clampedFrame),
    cameraViewId,
    focusEntityIds,
    activeCueIds: cues.map((cue) => cue.id),
    layers: mergedProfiles.map((profile) => {
      const cueEmphasis = resolveCueEmphasis(cues, profile.layerId)
      const emphasis = Math.max(profile.emphasis, cueEmphasis)

      return {
        ...profile,
        emphasis,
        opacity: profile.visible ? Math.min(1, Math.max(0.14, emphasis)) : 0.06,
      }
    }),
  }
}
