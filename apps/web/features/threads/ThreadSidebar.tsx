import {
  layerCatalog,
  type InputMode,
  type LayerId,
  type Project,
  type Thread,
} from '@momso/schema'
import { AuthorityBadge } from '../../components/AuthorityBadge'
import { NotionButton } from '../../components/NotionButton'
import { PanelFrame } from '../../components/PanelFrame'
import { useWorkspaceStore } from '../../stores/useWorkspaceStore'
import type { AudioInputDevice } from '../../src/hooks/useAudioInputs'
import { InputModePicker } from '../settings/InputModePicker'

interface ThreadSidebarProps {
  projects: Project[]
  activeProjectId: string | null
  threads: Thread[]
  selectedThreadId: string | null
  layerVisibility: Record<LayerId, boolean>
  inputMode: InputMode
  frame: number
  saveStatus: 'idle' | 'saving' | 'saved' | 'error'
  audioDevices: AudioInputDevice[]
  selectedAudioInputDeviceId: string | null
  audioLoading: boolean
  audioError: string | null
  onToggleLayer: (layerId: LayerId) => void
  onSelectThread: (threadId: string | null) => void
  onSelectProject: (projectId: string) => void
  onCreateProject: () => void
  onInputModeChange: (mode: InputMode) => void
  onSelectAudioDevice: (deviceId: string | null) => void
  onRequestAudioAccess: () => void
}

export function ThreadSidebar({
  projects,
  activeProjectId,
  threads,
  selectedThreadId,
  layerVisibility,
  inputMode,
  frame,
  saveStatus,
  audioDevices,
  selectedAudioInputDeviceId,
  audioLoading,
  audioError,
  onToggleLayer,
  onSelectThread,
  onSelectProject,
  onCreateProject,
  onInputModeChange,
  onSelectAudioDevice,
  onRequestAudioAccess,
}: ThreadSidebarProps) {
  const sidebarCollapsed = useWorkspaceStore((state) => state.sidebarCollapsed)
  const toggleSidebar = useWorkspaceStore((state) => state.toggleSidebar)

  return (
    <PanelFrame
      muted
      className="flex min-h-[320px] flex-col gap-4 overflow-hidden p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="mono-label">Workspace</p>
          <h1 className="truncate text-lg font-semibold">
            {sidebarCollapsed ? 'mo' : 'momso'}
          </h1>
          {!sidebarCollapsed && (
            <p className="mt-1 text-sm text-body-muted">
              Cloud workspace foundation
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
        <NotionButton tone="active">{sidebarCollapsed ? 'PRJ' : 'Projects'}</NotionButton>
        <NotionButton>{sidebarCollapsed ? 'L' : 'Prototype Layers'}</NotionButton>
        <NotionButton>{sidebarCollapsed ? 'T' : 'Threads'}</NotionButton>
      </div>

      <div className="space-y-3">
        {!sidebarCollapsed && <p className="mono-label">Projects</p>}
        <div className="flex flex-col gap-2">
          {projects.map((project) => {
            const active = activeProjectId === project.id
            return (
              <button
                key={project.id}
                type="button"
                className={[
                  'rounded-[10px] border px-3 py-3 text-left transition-colors',
                  active
                    ? 'border-body-border bg-white'
                    : 'border-transparent bg-transparent hover:bg-[rgba(55,53,47,0.08)]',
                ].join(' ')}
                onClick={() => onSelectProject(project.id)}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium">
                    {sidebarCollapsed ? project.title.slice(0, 3) : project.title}
                  </span>
                  {!sidebarCollapsed && (
                    <span className="text-xs text-body-muted">Frame {frame}</span>
                  )}
                </div>
                {!sidebarCollapsed && (
                  <p className="mt-2 text-sm leading-6 text-body-muted">
                    {project.description}
                  </p>
                )}
              </button>
            )
          })}

          <NotionButton fullWidth onClick={onCreateProject}>
            {sidebarCollapsed ? '+' : 'Create Cloud Project'}
          </NotionButton>
        </div>
      </div>

      <div className="space-y-3">
        {!sidebarCollapsed && <p className="mono-label">Body Note Prototype</p>}
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
                onClick={() => onToggleLayer(layer.id)}
              >
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: layer.accent }}
                />
                {!sidebarCollapsed && (
                  <>
                    <span className="min-w-0 flex-1 truncate">{layer.label}</span>
                    <AuthorityBadge grade={layer.authorityGrade} compact />
                  </>
                )}
                {sidebarCollapsed && (
                  <AuthorityBadge grade={layer.authorityGrade} compact />
                )}
              </button>
            )
          })}
        </div>
      </div>

      <div className="space-y-3">
        {!sidebarCollapsed && <p className="mono-label">Threads</p>}
        <div className="flex flex-col gap-2">
          {threads.map((thread) => {
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
                onClick={() => onSelectThread(thread.id)}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium">
                    {sidebarCollapsed ? thread.title.slice(0, 3) : thread.title}
                  </span>
                  {!sidebarCollapsed && (
                    <span className="text-xs text-body-muted">
                      {thread.frameStart}-{thread.frameEnd}
                    </span>
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
        <InputModePicker
          collapsed={sidebarCollapsed}
          inputMode={inputMode}
          onChange={onInputModeChange}
        />

        {!sidebarCollapsed && (
          <>
            <div className="subtle-card p-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-body-text">Save status</span>
                <span className="text-sm text-body-muted">{saveStatus}</span>
              </div>
              <div className="mt-2 flex items-center justify-between gap-3">
                <span className="text-sm text-body-text">Current frame</span>
                <span className="font-mono text-[12px] text-body-muted">{frame}</span>
              </div>
            </div>

            <div className="subtle-card p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-body-text">Audio Input</p>
                <NotionButton onClick={onRequestAudioAccess}>
                  {audioLoading ? 'Loading...' : 'Refresh'}
                </NotionButton>
              </div>

              <select
                className="mt-3 w-full rounded-[8px] border border-body-border bg-white px-3 py-2 text-sm text-body-text outline-none"
                value={selectedAudioInputDeviceId ?? ''}
                onChange={(event) =>
                  onSelectAudioDevice(event.currentTarget.value || null)
                }
              >
                <option value="">System default microphone</option>
                {audioDevices.map((device) => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label}
                  </option>
                ))}
              </select>

              <p className="mt-3 text-sm leading-6 text-body-muted">
                Browser speech recognition usually listens to the system default mic.
                We still persist your preferred device so a future recorder can reuse it.
              </p>
              {audioError && (
                <p className="mt-2 text-sm text-body-text">{audioError}</p>
              )}
            </div>
          </>
        )}
      </div>
    </PanelFrame>
  )
}
