import type { AuthorityGrade } from '../stores/workspaceSeed'

const badgeLabelMap: Record<AuthorityGrade, string> = {
  A: 'Anatomical',
  B: 'Estimated Proxy',
  C: 'Traditional Overlay',
}

const badgeToneMap: Record<AuthorityGrade, string> = {
  A: 'border-body-border bg-white text-body-text',
  B: 'border-dashed border-body-border bg-white text-body-muted',
  C: 'border-body-border bg-body-surface text-body-muted',
}

interface AuthorityBadgeProps {
  grade: AuthorityGrade
  compact?: boolean
}

export function AuthorityBadge({
  grade,
  compact = false,
}: AuthorityBadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1 rounded-full border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.18em]',
        badgeToneMap[grade],
      ].join(' ')}
    >
      <span>{grade}</span>
      {!compact && (
        <span className="tracking-[0.1em]">{badgeLabelMap[grade]}</span>
      )}
    </span>
  )
}
