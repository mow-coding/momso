import type { ButtonHTMLAttributes, ReactNode } from 'react'

type ButtonTone = 'default' | 'active' | 'quiet'

interface NotionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  tone?: ButtonTone
  fullWidth?: boolean
}

export function NotionButton({
  children,
  tone = 'default',
  fullWidth = false,
  className = '',
  type = 'button',
  ...props
}: NotionButtonProps) {
  return (
    <button
      type={type}
      className={[
        'ui-button',
        tone === 'active' && 'ui-button-active',
        tone === 'quiet' && 'ui-button-quiet',
        fullWidth && 'w-full justify-start',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
    </button>
  )
}
