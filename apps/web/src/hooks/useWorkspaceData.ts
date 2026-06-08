import { startTransition, useEffect, useMemo, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import type { Project, ProjectSettings, Thread, ThreadMemo, WorkspaceSnapshot } from '@momso/schema'
import { getSupabaseBrowserClient } from '../lib/supabase/client'
import {
  createProject,
  ensureUserWorkspace,
  loadWorkspaceSnapshot,
  saveMemo,
  saveProjectSettings,
  saveThread,
} from '../lib/supabase/repository'
import { sortThreads } from '../lib/workspace'

type WorkspaceStatus = 'idle' | 'loading' | 'ready' | 'error'
type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

function replaceThreadList(threads: Thread[], nextThread: Thread) {
  return sortThreads([
    nextThread,
    ...threads.filter((thread) => thread.id !== nextThread.id),
  ])
}

function replaceMemoList(memos: ThreadMemo[], nextMemo: ThreadMemo) {
  return [nextMemo, ...memos.filter((memo) => memo.id !== nextMemo.id)].sort((left, right) =>
    left.updatedAt < right.updatedAt ? 1 : -1,
  )
}

function replaceProjectList(projects: Project[], nextProject: Project) {
  return [nextProject, ...projects.filter((project) => project.id !== nextProject.id)]
}

export function useWorkspaceData(session: Session | null) {
  const supabase = useMemo(() => getSupabaseBrowserClient(), [])
  const [projects, setProjects] = useState<Project[]>([])
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)
  const [snapshot, setSnapshot] = useState<WorkspaceSnapshot | null>(null)
  const [status, setStatus] = useState<WorkspaceStatus>('idle')
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    void Promise.resolve().then(async () => {
      if (!active) {
        return
      }

      if (!session) {
        startTransition(() => {
          setProjects([])
          setActiveProjectId(null)
          setSnapshot(null)
          setStatus('idle')
          setSaveStatus('idle')
          setError(null)
        })
        return
      }

      startTransition(() => {
        setStatus('loading')
        setError(null)
      })

      try {
        const { projects: ensuredProjects, activeProjectId: ensuredProjectId } =
          await ensureUserWorkspace(supabase, session)

        if (!active) {
          return
        }

        startTransition(() => {
          setProjects(ensuredProjects)
          setActiveProjectId((current) => current ?? ensuredProjectId)
        })
      } catch (workspaceError) {
        if (!active) {
          return
        }

        setStatus('error')
        setError(
          workspaceError instanceof Error
            ? workspaceError.message
            : 'Failed to load user workspace.',
        )
      }
    })

    return () => {
      active = false
    }
  }, [session, supabase])

  useEffect(() => {
    if (!session || !activeProjectId) {
      return
    }

    let active = true
    void Promise.resolve().then(async () => {
      if (!active) {
        return
      }

      startTransition(() => {
        setStatus('loading')
        setError(null)
      })

      try {
        const nextSnapshot = await loadWorkspaceSnapshot(supabase, activeProjectId)

        if (!active) {
          return
        }

        startTransition(() => {
          setSnapshot(nextSnapshot)
          setStatus('ready')
        })
      } catch (workspaceError) {
        if (!active) {
          return
        }

        setStatus('error')
        setError(
          workspaceError instanceof Error
            ? workspaceError.message
            : 'Failed to load project snapshot.',
        )
      }
    })

    return () => {
      active = false
    }
  }, [activeProjectId, session, supabase])

  async function createCloudProject() {
    if (!session) {
      return null
    }

    setSaveStatus('saving')
    setError(null)

    try {
      const nextProject = await createProject(
        supabase,
        session.user.id,
        `momso Workspace ${projects.length + 1}`,
      )

      startTransition(() => {
        setProjects((current) => replaceProjectList(current, nextProject))
        setActiveProjectId(nextProject.id)
        setSaveStatus('saved')
      })

      return nextProject
    } catch (workspaceError) {
      setSaveStatus('error')
      setError(
        workspaceError instanceof Error
          ? workspaceError.message
          : 'Failed to create a new workspace.',
      )
      return null
    }
  }

  async function persistSettings(nextSettings: ProjectSettings) {
    setSaveStatus('saving')
    setError(null)

    try {
      const savedSettings = await saveProjectSettings(supabase, nextSettings)
      setSnapshot((current) =>
        current
          ? {
              ...current,
              settings: savedSettings,
            }
          : current,
      )
      setSaveStatus('saved')
      return savedSettings
    } catch (workspaceError) {
      setSaveStatus('error')
      setError(
        workspaceError instanceof Error
          ? workspaceError.message
          : 'Failed to persist project settings.',
      )
      throw workspaceError
    }
  }

  async function persistThread(nextThread: Thread) {
    setSaveStatus('saving')
    setError(null)

    try {
      const savedThread = await saveThread(supabase, nextThread)
      setSnapshot((current) =>
        current
          ? {
              ...current,
              threads: replaceThreadList(current.threads, savedThread),
            }
          : current,
      )
      setSaveStatus('saved')
      return savedThread
    } catch (workspaceError) {
      setSaveStatus('error')
      setError(
        workspaceError instanceof Error
          ? workspaceError.message
          : 'Failed to persist thread.',
      )
      throw workspaceError
    }
  }

  async function persistMemo(nextMemo: ThreadMemo) {
    setSaveStatus('saving')
    setError(null)

    try {
      const savedMemo = await saveMemo(supabase, nextMemo)
      setSnapshot((current) =>
        current
          ? {
              ...current,
              memos: replaceMemoList(current.memos, savedMemo),
            }
          : current,
      )
      setSaveStatus('saved')
      return savedMemo
    } catch (workspaceError) {
      setSaveStatus('error')
      setError(
        workspaceError instanceof Error
          ? workspaceError.message
          : 'Failed to persist memo.',
      )
      throw workspaceError
    }
  }

  return {
    projects,
    activeProjectId,
    snapshot,
    status,
    saveStatus,
    error,
    setActiveProjectId,
    createCloudProject,
    persistSettings,
    persistThread,
    persistMemo,
  }
}
