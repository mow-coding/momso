import type { HTMLAttributes, ReactNode } from 'react'

interface PanelFrameProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  muted?: boolean
}

export function PanelFrame({
  children,
  muted = false,
  className = '',
  ...props
}: PanelFrameProps) {
  return (
    <section
      className={[muted ? 'panel-muted' : 'panel-surface', className]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
    </section>
  )
}
