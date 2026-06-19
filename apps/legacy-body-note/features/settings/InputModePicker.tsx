import { NotionButton } from '../../components/NotionButton'
import { useWorkspaceStore } from '../../stores/useWorkspaceStore'
import { inputModeCatalog } from '../../stores/workspaceSeed'

interface InputModePickerProps {
  collapsed?: boolean
}

export function InputModePicker({
  collapsed = false,
}: InputModePickerProps) {
  const inputMode = useWorkspaceStore((state) => state.inputMode)
  const setInputMode = useWorkspaceStore((state) => state.setInputMode)

  return (
    <div className="flex flex-col gap-2">
      {!collapsed && <p className="mono-label">Input Mode</p>}
      <div className="flex flex-wrap gap-2">
        {inputModeCatalog.map((mode) => (
          <NotionButton
            key={mode.id}
            tone={inputMode === mode.id ? 'active' : 'default'}
            className={collapsed ? 'min-w-[44px] justify-center px-0' : ''}
            onClick={() => setInputMode(mode.id)}
          >
            {collapsed ? mode.shortLabel : mode.label}
          </NotionButton>
        ))}
      </div>
      {!collapsed && (
        <p className="text-sm leading-6 text-body-muted">
          {inputModeCatalog.find((mode) => mode.id === inputMode)?.description}
        </p>
      )}
    </div>
  )
}
