import type {
  LayerId,
  RegistryEntity,
  Thread,
  WorkspaceSnapshot,
} from '@momso/schema'
import type { ResolvedFrameState } from '@momso/schema'
import { AuthorityBadge } from '../../components/AuthorityBadge'
import { NotionButton } from '../../components/NotionButton'
import { PanelFrame } from '../../components/PanelFrame'
import { TimelineControls } from '../timeline/TimelineControls'
import { AnatomyCanvas } from './AnatomyCanvas'

interface ViewerPaneProps {
  workspace: WorkspaceSnapshot
  targetFrame: number
  resolvedFrame: number
  resolvedState: ResolvedFrameState
  layerVisibility: Record<LayerId, boolean>
  selectedEntity: RegistryEntity | null
  selectedThread: Thread | null
  selectedEntityId: string | null
  focusedEntityIds: string[]
  saveStatus: 'idle' | 'saving' | 'saved' | 'error'
  onSelectEntity: (entityId: string | null) => void
  onCreateThreadFromSelection: () => void
  canCreateThreadFromSelection: boolean
  onChangeFrame: (frame: number) => void
}

export function ViewerPane({
  workspace,
  targetFrame,
  resolvedFrame,
  resolvedState,
  layerVisibility,
  selectedEntity,
  selectedThread,
  selectedEntityId,
  focusedEntityIds,
  saveStatus,
  onSelectEntity,
  onCreateThreadFromSelection,
  canCreateThreadFromSelection,
  onChangeFrame,
}: ViewerPaneProps) {
  const highlightedSummary =
    selectedThread?.summary ??
    selectedEntity?.description ??
    'Select a prototype entity to create or continue a thread.'

  return (
    <PanelFrame className="flex min-h-[520px] flex-col overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-body-border px-4 py-3">
        <div className="space-y-1">
          <p className="mono-label">Deferred Body Note Prototype</p>
          <h2 className="text-lg font-semibold">{workspace.actionInstance.title}</h2>
          <p className="text-sm text-body-muted">
            This 3D anatomy surface is parked while momso keeps the cloud workspace real.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-body-border px-3 py-1 text-sm text-body-muted">
            Target {targetFrame}
          </span>
          <span className="rounded-full border border-body-border px-3 py-1 text-sm text-body-muted">
            Resolved {resolvedFrame}
          </span>
          <span className="rounded-full border border-body-border px-3 py-1 text-sm text-body-muted">
            Save {saveStatus}
          </span>
          {selectedEntity && <AuthorityBadge grade={selectedEntity.authorityGrade} compact />}
        </div>
      </div>

      <div className="relative flex-1 overflow-hidden bg-body-surface">
        <AnatomyCanvas
          frame={resolvedFrame}
          cameraViewId={resolvedState.cameraViewId}
          registry={workspace.registry}
          layerVisibility={layerVisibility}
          selectedEntityId={selectedEntityId}
          focusedEntityIds={focusedEntityIds}
          onSelectEntity={onSelectEntity}
        />

        <div className="pointer-events-none absolute left-4 top-4 z-10 max-w-[25rem]">
          <div className="overlay-card p-3">
            <p className="mono-label">Resolved Layers</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {resolvedState.layers
                .filter((layer) => layerVisibility[layer.layerId])
                .map((layer) => (
                  <div
                    key={layer.layerId}
                    className="inline-flex items-center gap-2 rounded-full border border-body-border bg-white/70 px-2.5 py-1.5 text-[11px] text-body-muted"
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: layer.accent }}
                    />
                    <span>{layer.label}</span>
                    <span className="font-mono">{Math.round(layer.emphasis * 100)}%</span>
                    <AuthorityBadge grade={layer.authorityGrade} compact />
                  </div>
                ))}
            </div>
          </div>
        </div>

        <div className="pointer-events-none absolute right-4 top-4 z-10 w-full max-w-[17rem] overlay-card p-4">
          <p className="mono-label">Selection</p>
          <div className="mt-3 flex flex-col gap-2 text-sm text-body-muted">
            <div className="flex items-start justify-between gap-3">
              <span>Entity</span>
              <span className="max-w-[9rem] text-right text-body-text">
                {selectedEntity?.label ?? 'None'}
              </span>
            </div>
            <div className="flex items-start justify-between gap-3">
              <span>Thread</span>
              <span className="max-w-[9rem] text-right text-body-text">
                {selectedThread?.title ?? 'No thread yet'}
              </span>
            </div>
            <div className="flex items-start justify-between gap-3">
              <span>Camera</span>
              <span className="font-mono text-[12px] text-body-text">
                {resolvedState.cameraViewId}
              </span>
            </div>
          </div>

          <div className="mt-4 pointer-events-auto">
            <NotionButton
              tone="active"
              fullWidth
              disabled={!canCreateThreadFromSelection}
              onClick={onCreateThreadFromSelection}
            >
              {canCreateThreadFromSelection
                ? 'Create Thread From Prototype'
                : 'Select a prototype entity first'}
            </NotionButton>
          </div>
        </div>

        <div className="pointer-events-none absolute left-6 bottom-32 z-10 max-w-[19rem]">
          <div className="overlay-card relative px-4 py-3">
            <div className="absolute -left-10 top-1/2 h-[0.5px] w-10 bg-body-border" />
            <p className="mono-label">Type B Callout</p>
            <p className="mt-2 text-sm leading-6 text-body-text">{highlightedSummary}</p>
            <p className="mt-2 text-xs text-body-muted">
              {selectedThread
                ? `anchor ${selectedThread.anchorId}`
                : selectedEntity
                  ? `anchor ${selectedEntity.anchorId}`
                  : 'No active selection'}
            </p>
          </div>
        </div>

        <TimelineControls
          targetFrame={targetFrame}
          resolvedFrame={resolvedFrame}
          phaseLabel={resolvedState.phaseLabel}
          onChangeFrame={onChangeFrame}
        />
      </div>
    </PanelFrame>
  )
}
