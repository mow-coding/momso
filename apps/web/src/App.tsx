import { useEffect, useEffectEvent, useMemo, useState } from 'react'
import type { RegistryEntity, Thread, ThreadMemo } from '@momso/schema'
import { parseMentions, resolveRuntimeFrame, createThreadDraftFromSelection } from '@momso/runtime'
import { AuthGate } from '../features/auth/AuthGate'
import { AnnotationEditor } from '../features/threads/AnnotationEditor'
import { useTimelineFrameSync } from '../features/timeline/useTimelineFrameSync'
import { ThreadSidebar } from '../features/threads/ThreadSidebar'
import { ViewerPane } from '../features/viewer/ViewerPane'
import { useAudioInputs } from './hooks/useAudioInputs'
import { useAuthSession } from './hooks/useAuthSession'
import { useSpeechRecognition } from './hooks/useSpeechRecognition'
import { useWorkspaceData } from './hooks/useWorkspaceData'
import { findMemoForThread, getMemoDraftKey, getThreadById, getThreadsForEntity } from './lib/workspace'
import { InbodylikePrototype } from './prototype/InbodylikePrototype'
import { PanelFrame } from '../components/PanelFrame'
import { useWorkspaceStore } from '../stores/useWorkspaceStore'

function createId() {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `fallback-${Math.random().toString(36).slice(2, 10)}`
  )
}

function shouldShowInbodylikePrototype() {
  const params = new URLSearchParams(window.location.search)

  return window.location.pathname === '/prototype' || params.get('demo') === 'inbodylike'
}

// On localhost we default to the prototype surface so the Supabase sign-in
// gate never blocks design/preview work (and a missing local .env can't white
// -screen a collaborator's machine). The authenticated cloud workspace is
// still reachable in dev via ?app=workspace or /workspace. Production builds
// always require auth.
function shouldShowWorkspace() {
  if (!import.meta.env.DEV) {
    return true
  }

  const params = new URLSearchParams(window.location.search)

  return window.location.pathname === '/workspace' || params.get('app') === 'workspace'
}

function WorkspaceApp() {
  useTimelineFrameSync()

  const [email, setEmail] = useState('')
  const auth = useAuthSession()
  const workspace = useWorkspaceData(auth.session)
  const audioInputs = useAudioInputs()
  const speech = useSpeechRecognition()

  const sidebarCollapsed = useWorkspaceStore((state) => state.sidebarCollapsed)
  const hydratedProjectId = useWorkspaceStore((state) => state.hydratedProjectId)
  const targetFrame = useWorkspaceStore((state) => state.targetFrame)
  const resolvedFrame = useWorkspaceStore((state) => state.resolvedFrame)
  const selectedThreadId = useWorkspaceStore((state) => state.selectedThreadId)
  const selectedEntityId = useWorkspaceStore((state) => state.selectedEntityId)
  const focusedEntityId = useWorkspaceStore((state) => state.focusedEntityId)
  const activeMemoType = useWorkspaceStore((state) => state.activeMemoType)
  const inputMode = useWorkspaceStore((state) => state.inputMode)
  const layerVisibility = useWorkspaceStore((state) => state.layerVisibility)
  const editorDrafts = useWorkspaceStore((state) => state.editorDrafts)
  const hydrateProject = useWorkspaceStore((state) => state.hydrateProject)
  const setTargetFrame = useWorkspaceStore((state) => state.setTargetFrame)
  const selectThread = useWorkspaceStore((state) => state.selectThread)
  const selectEntity = useWorkspaceStore((state) => state.selectEntity)
  const setFocusedEntity = useWorkspaceStore((state) => state.setFocusedEntity)
  const setActiveMemoType = useWorkspaceStore((state) => state.setActiveMemoType)
  const setInputMode = useWorkspaceStore((state) => state.setInputMode)
  const toggleLayer = useWorkspaceStore((state) => state.toggleLayer)
  const setDraft = useWorkspaceStore((state) => state.setDraft)
  const updateDraft = useWorkspaceStore((state) => state.updateDraft)

  const snapshot = workspace.snapshot

  useEffect(() => {
    if (!snapshot || hydratedProjectId === snapshot.project.id) {
      return
    }

    const selectedFromSettings =
      snapshot.settings.lastSelectedEntityId ??
      snapshot.threads.find((thread) => thread.id === snapshot.settings.lastSelectedThreadId)
        ?.targetEntityId ??
      null

    hydrateProject({
      projectId: snapshot.project.id,
      frame: snapshot.settings.lastOpenedFrame,
      inputMode: snapshot.settings.inputMode,
      selectedThreadId: snapshot.settings.lastSelectedThreadId,
      selectedEntityId: selectedFromSettings,
    })
  }, [hydrateProject, hydratedProjectId, snapshot])

  const selectedThread = useMemo(
    () => getThreadById(snapshot, selectedThreadId),
    [selectedThreadId, snapshot],
  )

  useEffect(() => {
    if (selectedThread && selectedEntityId !== selectedThread.targetEntityId) {
      selectEntity(selectedThread.targetEntityId)
    }
  }, [selectEntity, selectedEntityId, selectedThread])

  const selectedEntity = useMemo<RegistryEntity | null>(() => {
    if (!snapshot) {
      return null
    }

    const fallbackEntityId = selectedThread?.targetEntityId ?? null
    const targetEntityId = selectedEntityId ?? fallbackEntityId

    if (!targetEntityId) {
      return null
    }

    return (
      snapshot.registry.entities.find((entity) => entity.id === targetEntityId) ?? null
    )
  }, [selectedEntityId, selectedThread?.targetEntityId, snapshot])

  const resolvedState = useMemo(
    () => (snapshot ? resolveRuntimeFrame(snapshot, resolvedFrame) : null),
    [resolvedFrame, snapshot],
  )

  const focusEntityIds = useMemo(
    () =>
      Array.from(
        new Set(
          [
            ...(resolvedState?.focusEntityIds ?? []),
            selectedEntity?.id ?? null,
            focusedEntityId,
          ].filter((value): value is string => Boolean(value)),
        ),
      ),
    [focusedEntityId, resolvedState?.focusEntityIds, selectedEntity?.id],
  )

  const draftKey = useMemo(() => {
    if (selectedThread) {
      return getMemoDraftKey(
        selectedThread.id,
        activeMemoType,
        activeMemoType === 'keyframed' ? targetFrame : null,
      )
    }

    if (selectedEntity) {
      return getMemoDraftKey(
        `selection:${selectedEntity.id}`,
        activeMemoType,
        activeMemoType === 'keyframed' ? targetFrame : null,
      )
    }

    return null
  }, [activeMemoType, selectedEntity, selectedThread, targetFrame])

  const currentMemo = useMemo<ThreadMemo | null>(() => {
    if (!snapshot || !selectedThread) {
      return null
    }

    return (
      findMemoForThread(snapshot.memos, selectedThread.id, activeMemoType, targetFrame) ??
      null
    )
  }, [activeMemoType, selectedThread, snapshot, targetFrame])

  useEffect(() => {
    if (!draftKey || editorDrafts[draftKey] !== undefined) {
      return
    }

    setDraft(draftKey, currentMemo?.body ?? '')
  }, [currentMemo?.body, draftKey, editorDrafts, setDraft])

  const draftValue = draftKey ? editorDrafts[draftKey] ?? currentMemo?.body ?? '' : ''

  const persistUiSettings = useEffectEvent(async () => {
    if (!snapshot) {
      return
    }

    const nextSelectedEntityId = selectedEntity?.id ?? null
    const nextSettings = {
      ...snapshot.settings,
      inputMode,
      lastOpenedFrame: targetFrame,
      lastSelectedThreadId: selectedThread?.id ?? null,
      lastSelectedEntityId: nextSelectedEntityId,
      updatedAt: new Date().toISOString(),
    }

    const hasChange =
      snapshot.settings.inputMode !== nextSettings.inputMode ||
      snapshot.settings.lastOpenedFrame !== nextSettings.lastOpenedFrame ||
      snapshot.settings.lastSelectedThreadId !== nextSettings.lastSelectedThreadId ||
      snapshot.settings.lastSelectedEntityId !== nextSettings.lastSelectedEntityId

    if (!hasChange) {
      return
    }

    try {
      await workspace.persistSettings(nextSettings)
    } catch {
      // Error state is already surfaced by the workspace hook.
    }
  })

  useEffect(() => {
    if (!snapshot) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      void persistUiSettings()
    }, 500)

    return () => window.clearTimeout(timeoutId)
  }, [
    inputMode,
    selectedEntity?.id,
    selectedThread?.id,
    snapshot,
    targetFrame,
  ])

  async function handleCreateThreadFromSelection() {
    if (!snapshot || !selectedEntity) {
      return null
    }

    const draft = createThreadDraftFromSelection(
      { entityId: selectedEntity.id },
      targetFrame,
      snapshot.registry,
    )
    const existingDraftValue = draftKey ? editorDrafts[draftKey] ?? '' : ''
    const now = new Date().toISOString()
    const nextThread: Thread = {
      id: createId(),
      projectId: snapshot.project.id,
      actionInstanceId: snapshot.actionInstance.id,
      title: draft.title,
      summary: draft.summary,
      targetEntityId: draft.targetEntityId,
      anchorId: draft.anchorId,
      cameraViewId: draft.cameraViewId,
      frameStart: draft.frameStart,
      frameEnd: draft.frameEnd,
      createdAt: now,
      updatedAt: now,
    }

    try {
      const savedThread = await workspace.persistThread(nextThread)
      const nextDraftKey = getMemoDraftKey(
        savedThread.id,
        activeMemoType,
        activeMemoType === 'keyframed' ? targetFrame : null,
      )
      setDraft(nextDraftKey, existingDraftValue)
      selectThread(savedThread.id)
      selectEntity(savedThread.targetEntityId)
      setFocusedEntity(savedThread.targetEntityId)
      return savedThread
    } catch {
      // Error state is already surfaced by the workspace hook.
      return null
    }
  }

  async function handleSaveMemo(options: {
    transcriptSource: string | null
    transcriptReviewed: boolean
  }) {
    if (!snapshot || !selectedEntity || !draftKey) {
      return
    }

    let thread = selectedThread

    if (!thread) {
      thread = await handleCreateThreadFromSelection()
    }

    if (!thread) {
      return
    }

    const now = new Date().toISOString()
    const mentions = parseMentions(draftValue, snapshot.registry)
    const nextMemo: ThreadMemo = currentMemo
      ? {
          ...currentMemo,
          body: draftValue,
          mentions,
          transcriptSource: options.transcriptSource,
          transcriptReviewed: options.transcriptReviewed,
          updatedAt: now,
        }
      : {
          id: createId(),
          projectId: snapshot.project.id,
          threadId: thread.id,
          memoType: activeMemoType,
          frame: activeMemoType === 'keyframed' ? targetFrame : null,
          body: draftValue,
          mentions,
          transcriptSource: options.transcriptSource,
          transcriptReviewed: options.transcriptReviewed,
          createdAt: now,
          updatedAt: now,
        }

    try {
      const savedMemo = await workspace.persistMemo(nextMemo)
      setDraft(draftKey, savedMemo.body)
      onResetVoiceState()
    } catch {
      // Error state is already surfaced by the workspace hook.
    }
  }

  function handleSelectThread(threadId: string | null) {
    if (!snapshot) {
      return
    }

    selectThread(threadId)

    const nextThread = getThreadById(snapshot, threadId)

    if (nextThread) {
      selectEntity(nextThread.targetEntityId)
      setFocusedEntity(nextThread.targetEntityId)
    }
  }

  function handleSelectEntity(entityId: string | null) {
    if (!snapshot) {
      return
    }

    if (!entityId) {
      setFocusedEntity(null)
      if (!selectedThread) {
        selectEntity(null)
      }
      return
    }

    selectEntity(entityId)
    setFocusedEntity(entityId)

    const relatedThreads = getThreadsForEntity(snapshot.threads, entityId)
    if (relatedThreads.length > 0) {
      selectThread(relatedThreads[0].id)
    } else {
      selectThread(null)
    }
  }

  async function handleSelectAudioDevice(deviceId: string | null) {
    if (!snapshot) {
      return
    }

    try {
      await workspace.persistSettings({
        ...snapshot.settings,
        selectedAudioInputDeviceId: deviceId,
        updatedAt: new Date().toISOString(),
      })
    } catch {
      // Error state is already surfaced by the workspace hook.
    }
  }

  function onResetVoiceState() {
    speech.reset()
  }

  if (auth.status === 'loading') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-body-bg p-4">
        <PanelFrame className="w-full max-w-lg p-6">
          <p className="mono-label">Auth</p>
          <h1 className="mt-3 text-xl font-semibold">Checking Supabase session...</h1>
        </PanelFrame>
      </main>
    )
  }

  if (!auth.session) {
    return (
      <AuthGate
        email={email}
        status={auth.status}
        error={auth.error}
        lastEmail={auth.lastEmail}
        onEmailChange={setEmail}
        onSubmit={() => {
          void auth.sendMagicLink(email)
        }}
      />
    )
  }

  if (!snapshot || !resolvedState || workspace.status === 'loading') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-body-bg p-4">
        <PanelFrame className="w-full max-w-lg p-6">
          <p className="mono-label">Workspace</p>
          <h1 className="mt-3 text-xl font-semibold">Loading your cloud workspace...</h1>
          {workspace.error && (
            <p className="mt-3 text-sm text-body-text">{workspace.error}</p>
          )}
        </PanelFrame>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-body-bg p-3 sm:p-4">
      <div
        className={[
          'mx-auto grid min-h-[calc(100vh-1.5rem)] max-w-[1800px] grid-cols-1 gap-3 lg:gap-4',
          sidebarCollapsed
            ? 'lg:grid-cols-[5.5rem_minmax(0,1.35fr)_minmax(0,0.95fr)]'
            : 'lg:grid-cols-[18rem_minmax(0,1.35fr)_minmax(0,1fr)]',
        ].join(' ')}
      >
        <ThreadSidebar
          projects={workspace.projects}
          activeProjectId={workspace.activeProjectId}
          threads={snapshot.threads}
          selectedThreadId={selectedThread?.id ?? null}
          layerVisibility={layerVisibility}
          inputMode={inputMode}
          frame={targetFrame}
          saveStatus={workspace.saveStatus}
          audioDevices={audioInputs.devices}
          selectedAudioInputDeviceId={snapshot.settings.selectedAudioInputDeviceId}
          audioLoading={audioInputs.loading}
          audioError={audioInputs.error}
          onToggleLayer={toggleLayer}
          onSelectThread={handleSelectThread}
          onSelectProject={(projectId) => workspace.setActiveProjectId(projectId)}
          onCreateProject={() => {
            void workspace.createCloudProject()
          }}
          onInputModeChange={setInputMode}
          onSelectAudioDevice={(deviceId) => {
            void handleSelectAudioDevice(deviceId)
          }}
          onRequestAudioAccess={() => {
            void audioInputs.refreshDevices(true)
          }}
        />

        <ViewerPane
          workspace={snapshot}
          targetFrame={targetFrame}
          resolvedFrame={resolvedFrame}
          resolvedState={resolvedState}
          layerVisibility={layerVisibility}
          selectedEntity={selectedEntity}
          selectedThread={selectedThread}
          selectedEntityId={selectedEntity?.id ?? null}
          focusedEntityIds={focusEntityIds}
          saveStatus={workspace.saveStatus}
          onSelectEntity={handleSelectEntity}
          onCreateThreadFromSelection={() => {
            void handleCreateThreadFromSelection()
          }}
          canCreateThreadFromSelection={Boolean(selectedEntity)}
          onChangeFrame={setTargetFrame}
        />

        <AnnotationEditor
          workspace={snapshot}
          selectedThread={selectedThread}
          selectedEntity={selectedEntity}
          targetFrame={targetFrame}
          activeMemoType={activeMemoType}
          currentMemo={currentMemo}
          draftValue={draftValue}
          inputMode={inputMode}
          saveStatus={workspace.saveStatus}
          voiceSupported={speech.supported}
          voiceListening={speech.isListening}
          voiceTranscript={speech.finalTranscript}
          voiceInterimTranscript={speech.interimTranscript}
          voiceError={speech.error}
          canCreateThreadFromSelection={Boolean(selectedEntity)}
          onChangeMemoType={setActiveMemoType}
          onDraftChange={(value) => {
            if (draftKey) {
              updateDraft(draftKey, value)
            }
          }}
          onCreateThreadFromSelection={() => {
            void handleCreateThreadFromSelection()
          }}
          onSaveMemo={(options) => {
            void handleSaveMemo(options)
          }}
          onStartVoice={speech.start}
          onStopVoice={speech.stop}
          onResetVoice={onResetVoiceState}
          onFocusEntity={setFocusedEntity}
        />
      </div>
    </main>
  )
}

function App() {
  if (shouldShowInbodylikePrototype()) {
    return <InbodylikePrototype />
  }

  if (!shouldShowWorkspace()) {
    return <InbodylikePrototype />
  }

  return <WorkspaceApp />
}

export default App
