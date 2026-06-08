import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { createStarterWorkspace } from '@momso/schema'
import {
  createThreadDraftFromSelection,
  parseMentions,
  resolveRuntimeFrame,
} from '@momso/runtime'
import { AuthGate } from '../../features/auth/AuthGate'

describe('runtime pipeline', () => {
  const workspace = createStarterWorkspace(
    '11111111-1111-1111-1111-111111111111',
  )

  it('resolves family and instance cues on the same canonical frame', () => {
    const resolvedFrame = resolveRuntimeFrame(workspace, 58)
    const ligamentLayer = resolvedFrame.layers.find((layer) => layer.layerId === 'ligament')

    expect(resolvedFrame.frame).toBe(58)
    expect(resolvedFrame.cameraViewId).toBe('cam.body.kneeClose')
    expect(resolvedFrame.focusEntityIds).toContain('ligament.patellar.R')
    expect(ligamentLayer?.emphasis).toBeGreaterThan(0.9)
  })

  it('parses mentions against the registry aliases and ids', () => {
    const mentions = parseMentions(
      'Cue @glute and @joint.ankle.R before ascent.',
      workspace.registry,
    )

    expect(mentions).toHaveLength(2)
    expect(mentions[0]?.entityId).toBe('muscle.gluteus_maximus.R')
    expect(mentions[1]?.entityId).toBe('joint.ankle.R')
  })

  it('creates a thread draft from the active entity selection', () => {
    const threadDraft = createThreadDraftFromSelection(
      { entityId: 'muscle.gluteus_maximus.R' },
      24,
      workspace.registry,
    )

    expect(threadDraft.title).toContain('Gluteus Maximus')
    expect(threadDraft.targetEntityId).toBe('muscle.gluteus_maximus.R')
    expect(threadDraft.anchorId).toBe('anchor.hip.R.posterolateral')
  })
})

describe('AuthGate', () => {
  it('renders the email CTA and calls submit through the button', () => {
    const onSubmit = vi.fn()

    render(
      <AuthGate
        email="mow.coding@gmail.com"
        status="unauthenticated"
        error={null}
        lastEmail={null}
        onEmailChange={() => undefined}
        onSubmit={onSubmit}
      />,
    )

    screen.getByText('Sign in to your momso workspace')
    screen.getByRole('button', { name: 'Send magic link' }).click()

    expect(onSubmit).toHaveBeenCalledTimes(1)
  })
})
