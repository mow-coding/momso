import { AuthorityBadge } from '../../components/AuthorityBadge'
import { NotionButton } from '../../components/NotionButton'
import { PanelFrame } from '../../components/PanelFrame'
import { useWorkspaceStore } from '../../stores/useWorkspaceStore'
import { layerCatalog, threadCatalog } from '../../stores/workspaceSeed'
import { TimelineControls } from '../timeline/TimelineControls'
import { AnatomyCanvas } from './AnatomyCanvas'

export function ViewerPane() {
  const targetFrame = useWorkspaceStore((state) => state.targetFrame)
  const resolvedFrame = useWorkspaceStore((state) => state.resolvedFrame)
  const selectedThreadId = useWorkspaceStore((state) => state.selectedThreadId)

  const selectedThread =
    threadCatalog.find((thread) => thread.id === selectedThreadId) ??
    threadCatalog[0]

  return (
    <PanelFrame className="flex min-h-[520px] flex-col overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-body-border px-4 py-3">
        <div className="space-y-1">
          <p className="mono-label">Center-left 3D Viewport</p>
          <h2 className="text-lg font-semibold">
            Synced 7-Layer Anatomy Canvas
          </h2>
          <p className="text-sm text-body-muted">
            A/B/C authority를 같은 프레임 위에서 차분하게 비교하는 초기 뷰입니다.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-body-border px-3 py-1 text-sm text-body-muted">
            Target {targetFrame}
          </span>
          <span className="rounded-full border border-body-border px-3 py-1 text-sm text-body-muted">
            Resolved {resolvedFrame}
          </span>
          <NotionButton>Orbit</NotionButton>
          <NotionButton tone="active">Type B Callout</NotionButton>
        </div>
      </div>

      <div className="relative flex-1 overflow-hidden bg-body-surface">
        <AnatomyCanvas />

        <div className="pointer-events-none absolute left-4 top-4 z-10 max-w-[24rem]">
          <div className="overlay-card p-3">
            <p className="mono-label">Visible Layers</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {layerCatalog.map((layer) => (
                <div
                  key={layer.id}
                  className="inline-flex items-center gap-2 rounded-full border border-body-border bg-white/70 px-2.5 py-1.5 text-[11px] text-body-muted"
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: layer.accent }}
                  />
                  <span>{layer.label}</span>
                  <AuthorityBadge grade={layer.authority} compact />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="pointer-events-none absolute right-4 top-4 z-10 w-full max-w-[16.5rem] overlay-card p-4">
          <p className="mono-label">Authority Legend</p>
          <div className="mt-3 flex flex-col gap-2 text-sm text-body-muted">
            <div className="flex items-center justify-between gap-3">
              <AuthorityBadge grade="A" compact />
              <span>검증된 해부학 구조</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <AuthorityBadge grade="B" compact />
              <span>프록시 기반 추정값</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <AuthorityBadge grade="C" compact />
              <span>정적 이론 오버레이</span>
            </div>
          </div>
        </div>

        <div className="pointer-events-none absolute left-6 bottom-32 z-10 max-w-[19rem]">
          <div className="overlay-card relative px-4 py-3">
            <div className="absolute -left-10 top-1/2 h-[0.5px] w-10 bg-body-border" />
            <p className="mono-label">Type B Callout</p>
            <p className="mt-2 text-sm leading-6 text-body-text">
              {selectedThread.summary}
            </p>
            <p className="mt-2 text-xs text-body-muted">
              anchor {selectedThread.anchorId}
            </p>
          </div>
        </div>

        <TimelineControls />
      </div>
    </PanelFrame>
  )
}
