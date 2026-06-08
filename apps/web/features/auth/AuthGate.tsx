import { NotionButton } from '../../components/NotionButton'
import { PanelFrame } from '../../components/PanelFrame'

interface AuthGateProps {
  email: string
  status: 'loading' | 'unauthenticated' | 'sending-link' | 'authenticated'
  error: string | null
  lastEmail: string | null
  onEmailChange: (value: string) => void
  onSubmit: () => void
}

export function AuthGate({
  email,
  status,
  error,
  lastEmail,
  onEmailChange,
  onSubmit,
}: AuthGateProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-body-bg p-4">
      <PanelFrame className="w-full max-w-xl p-6 sm:p-8">
        <p className="mono-label">momso Cloud Core</p>
        <h1 className="mt-3 text-2xl font-semibold text-body-text">
          Sign in to your momso workspace
        </h1>
        <p className="mt-3 text-sm leading-7 text-body-muted">
          This alpha uses Supabase email sign-in. We send a passwordless link so
          the momso workspace can stay protected while the product brief evolves.
        </p>

        <label className="mt-6 block text-sm text-body-text" htmlFor="auth-email">
          Email
        </label>
        <input
          id="auth-email"
          className="mt-2 w-full rounded-[8px] border border-body-border bg-white px-3 py-3 outline-none ring-0"
          type="email"
          autoComplete="email"
          placeholder="mow.coding@gmail.com"
          value={email}
          onChange={(event) => onEmailChange(event.currentTarget.value)}
        />

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <NotionButton
            tone="active"
            className="min-w-[140px]"
            disabled={status === 'sending-link' || email.trim().length === 0}
            onClick={onSubmit}
          >
            {status === 'sending-link' ? 'Sending link...' : 'Send magic link'}
          </NotionButton>
          {lastEmail && (
            <span className="text-sm text-body-muted">
              Last email sent to {lastEmail}
            </span>
          )}
        </div>

        {error && (
          <div className="mt-4 rounded-[8px] border border-body-border bg-body-surface px-3 py-3 text-sm text-body-text">
            {error}
          </div>
        )}

        <div className="mt-6 subtle-card p-4 text-sm leading-7 text-body-muted">
          After the email arrives, open the magic link in the same browser. The app will
          pick up the Supabase session automatically.
        </div>
      </PanelFrame>
    </main>
  )
}
