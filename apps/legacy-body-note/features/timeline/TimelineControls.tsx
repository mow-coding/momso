import { useWorkspaceStore } from '../../stores/useWorkspaceStore'
import { getPhaseLabel } from '../../stores/workspaceSeed'

export function TimelineControls() {
  const targetFrame = useWorkspaceStore((state) => state.targetFrame)
  const resolvedFrame = useWorkspaceStore((state) => state.resolvedFrame)
  const setTargetFrame = useWorkspaceStore((state) => state.setTargetFrame)

  return (
    <div className="overlay-card absolute inset-x-4 bottom-4 z-20 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="mono-label">Single Canonical Timeline</p>
          <p className="text-sm leading-6 text-body-muted">
            슬라이더는 target frame만 바꾸고, 렌더 프레임은 한 번 더 정리해
            맞춥니다.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm text-body-muted">
          <span className="rounded-full border border-body-border px-3 py-1">
            Phase {getPhaseLabel(resolvedFrame)}
          </span>
          <span className="rounded-full border border-body-border px-3 py-1">
            Target {targetFrame}
          </span>
          <span className="rounded-full border border-body-border px-3 py-1">
            Resolved {resolvedFrame}
          </span>
        </div>
      </div>

      <input
        aria-label="Timeline frame"
        className="timeline-range mt-4 w-full accent-[#37352F]"
        type="range"
        min={0}
        max={100}
        step={1}
        value={targetFrame}
        onChange={(event) => setTargetFrame(Number(event.currentTarget.value))}
      />

      <div className="mt-2 flex items-center justify-between text-xs text-body-muted">
        <span>0</span>
        <span>25</span>
        <span>50</span>
        <span>75</span>
        <span>100</span>
      </div>
    </div>
  )
}
