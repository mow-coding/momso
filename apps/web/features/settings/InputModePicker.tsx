import { inputModeCatalog, type InputMode } from '@momso/schema'
import { NotionButton } from '../../components/NotionButton'

interface InputModePickerProps {
  collapsed?: boolean
  inputMode: InputMode
  onChange: (mode: InputMode) => void
}

export function InputModePicker({
  collapsed = false,
  inputMode,
  onChange,
}: InputModePickerProps) {
  return (
    <div className="flex flex-col gap-2">
      {!collapsed && <p className="mono-label">Input Mode</p>}
      <div className="flex flex-wrap gap-2">
        {inputModeCatalog.map((mode) => (
          <NotionButton
            key={mode.id}
            tone={inputMode === mode.id ? 'active' : 'default'}
            className={collapsed ? 'min-w-[44px] justify-center px-0' : ''}
            onClick={() => onChange(mode.id)}
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
