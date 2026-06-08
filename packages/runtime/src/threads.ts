import {
  anatomyRegistry,
  canonicalFrameDomain,
  type RegistryBundle,
  type ThreadDraft,
} from '@momso/schema'

export function createThreadDraftFromSelection(
  selection: {
    entityId: string
  },
  frame: number,
  registry: RegistryBundle = anatomyRegistry,
): ThreadDraft {
  const entity =
    registry.entities.find((item) => item.id === selection.entityId) ??
    registry.entities[0]
  const anchor =
    registry.anchors.find((item) => item.id === entity.anchorId) ?? registry.anchors[0]

  return {
    title: `${entity.label} Thread`,
    summary: `Document the ${entity.label} cue at frame ${Math.round(frame)}.`,
    targetEntityId: entity.id,
    anchorId: anchor.id,
    cameraViewId: anchor.cameraViewId,
    frameStart: canonicalFrameDomain.min,
    frameEnd: canonicalFrameDomain.max,
  }
}
