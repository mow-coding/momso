import { useEffect, useEffectEvent } from 'react'
import { useWorkspaceStore } from '../../stores/useWorkspaceStore'

export function useTimelineFrameSync() {
  const targetFrame = useWorkspaceStore((state) => state.targetFrame)
  const resolvedFrame = useWorkspaceStore((state) => state.resolvedFrame)
  const setResolvedFrame = useWorkspaceStore((state) => state.setResolvedFrame)

  const commitFrame = useEffectEvent((nextFrame: number) => {
    setResolvedFrame(nextFrame)
  })

  useEffect(() => {
    if (targetFrame === resolvedFrame) {
      return undefined
    }

    const frameId = window.requestAnimationFrame(() => {
      commitFrame(targetFrame)
    })

    return () => window.cancelAnimationFrame(frameId)
  }, [resolvedFrame, targetFrame])
}
