import { AuthorityBadge } from '../../components/AuthorityBadge'
import { NotionButton } from '../../components/NotionButton'
import { PanelFrame } from '../../components/PanelFrame'
import { useWorkspaceStore } from '../../stores/useWorkspaceStore'
import {
  layerCatalog,
  threadCatalog,
  workspaceSummary,
} from '../../stores/workspaceSeed'
import { InputModePicker } from '../settings/InputModePicker'

export function ThreadSidebar() {
  const sidebarCollapsed = useWorkspaceStore((state) => state.sidebarCollapsed)
  const selectedThreadId = useWorkspaceStore((state) => state.selectedThreadId)
  const layerVisibility = useWorkspaceStore((state) => state.layerVisibility)
  const toggleLayer = useWorkspaceStore((state) => state.toggleLayer)
  const selectThread = useWorkspaceStore((state) => state.selectThread)
  const toggleSidebar = useWorkspaceStore((state) => state.toggleSidebar)

  return (
    <PanelFrame
      muted
      className="flex min-h-[320px] flex-col gap-4 overflow-hidden p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="mono-label">Left Sidebar</p>
          <h1 className="truncate text-lg font-semibold">
            {sidebarCollapsed ? 'BN' : workspaceSummary.productName}
          </h1>
          {!sidebarCollapsed && (
            <p className="mt-1 text-sm text-body-muted">
              {workspaceSummary.projectName}
            </p>
          )}
        </div>

        <NotionButton
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="shrink-0"
          onClick={toggleSidebar}
        >
          {sidebarCollapsed ? '>' : '<'}
        </NotionButton>
      </div>

      <div className="flex flex-wrap gap-2">
        <NotionButton tone="active">
          {sidebarCollapsed ? 'WS' : 'Workspace'}
        </NotionButton>
        <NotionButton>{sidebarCollapsed ? 'AI' : 'Action Instance'}</NotionButton>
        <NotionButton>{sidebarCollapsed ? 'AN' : 'Annotations'}</NotionButton>
      </div>

      <div className="space-y-3">
        {!sidebarCollapsed && <p className="mono-label">Layer Control</p>}
        <div className="flex flex-col gap-2">
          {layerCatalog.map((layer) => {
            const enabled = layerVisibility[layer.id]

            return (
              <button
                key={layer.id}
                type="button"
                className={[
                  'flex items-center gap-3 rounded-[8px] border border-transparent px-3 py-2 text-left text-sm transition-colors',
                  enabled
                    ? 'bg-white text-body-text'
                    : 'bg-transparent text-body-muted hover:bg-[rgba(55,53,47,0.08)]',
                ].join(' ')}
                onClick={() => toggleLayer(layer.id)}
              >
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: layer.accent }}
                />
                {!sidebarCollapsed && (
                  <>
                    <span className="min-w-0 flex-1 truncate">{layer.label}</span>
                    <AuthorityBadge grade={layer.authority} compact />
                  </>
                )}
                {sidebarCollapsed && (
                  <AuthorityBadge grade={layer.authority} compact />
                )}
              </button>
            )
          })}
        </div>
      </div>

      <div className="space-y-3">
        {!sidebarCollapsed && <p className="mono-label">Threads</p>}
        <div className="flex flex-col gap-2">
          {threadCatalog.map((thread) => {
            const active = selectedThreadId === thread.id

            return (
              <button
                key={thread.id}
                type="button"
                className={[
                  'rounded-[10px] border px-3 py-3 text-left transition-colors',
                  active
                    ? 'border-body-border bg-white'
                    : 'border-transparent bg-transparent hover:bg-[rgba(55,53,47,0.08)]',
                ].join(' ')}
                onClick={() => selectThread(thread.id)}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium">
                    {sidebarCollapsed ? thread.title.slice(0, 3) : thread.title}
                  </span>
                  {!sidebarCollapsed && (
                    <span className="text-xs text-body-muted">{thread.memoMode}</span>
                  )}
                </div>
                {!sidebarCollapsed && (
                  <p className="mt-2 text-sm leading-6 text-body-muted">
                    {thread.summary}
                  </p>
                )}
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-auto space-y-3">
        {!sidebarCollapsed && <p className="mono-label">Input Settings</p>}
        <InputModePicker collapsed={sidebarCollapsed} />
      </div>
    </PanelFrame>
  )
}
