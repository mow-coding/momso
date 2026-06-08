import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { type Mention, type MemoType, type RegistryEntity, type Thread, type ThreadMemo, type WorkspaceSnapshot } from '@momso/schema'
import {
  getActiveMention,
  parseMentions,
  replaceActiveMention,
  suggestMentions,
} from '@momso/runtime'
import { AuthorityBadge } from '../../components/AuthorityBadge'
import { NotionButton } from '../../components/NotionButton'
import { PanelFrame } from '../../components/PanelFrame'

interface AnnotationEditorProps {
  workspace: WorkspaceSnapshot
  selectedThread: Thread | null
  selectedEntity: RegistryEntity | null
  targetFrame: number
  activeMemoType: MemoType
  currentMemo: ThreadMemo | null
  draftValue: string
  inputMode: 'text' | 'mic' | 'hybrid'
  saveStatus: 'idle' | 'saving' | 'saved' | 'error'
  voiceSupported: boolean
  voiceListening: boolean
  voiceTranscript: string
  voiceInterimTranscript: string
  voiceError: string | null
  canCreateThreadFromSelection: boolean
  onChangeMemoType: (memoType: MemoType) => void
  onDraftChange: (value: string) => void
  onCreateThreadFromSelection: () => void
  onSaveMemo: (options: {
    transcriptSource: string | null
    transcriptReviewed: boolean
  }) => void
  onStartVoice: () => void
  onStopVoice: () => void
  onResetVoice: () => void
  onFocusEntity: (entityId: string | null) => void
}

function getEmptyStateMessage(selectedEntity: RegistryEntity | null) {
  if (selectedEntity) {
    return `Create a thread for ${selectedEntity.label} inside the parked Body Note prototype.`
  }

  return 'Select a prototype entity in the viewer to start a thread.'
}

export function AnnotationEditor({
  workspace,
  selectedThread,
  selectedEntity,
  targetFrame,
  activeMemoType,
  currentMemo,
  draftValue,
  inputMode,
  saveStatus,
  voiceSupported,
  voiceListening,
  voiceTranscript,
  voiceInterimTranscript,
  voiceError,
  canCreateThreadFromSelection,
  onChangeMemoType,
  onDraftChange,
  onCreateThreadFromSelection,
  onSaveMemo,
  onStartVoice,
  onStopVoice,
  onResetVoice,
  onFocusEntity,
}: AnnotationEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const [caretIndex, setCaretIndex] = useState(0)
  const fallbackCameraViewId =
    selectedThread?.cameraViewId ??
    workspace.registry.anchors.find((anchor) => anchor.id === selectedEntity?.anchorId)
      ?.cameraViewId ??
    workspace.project.defaultCameraViewId

  const mentionPreview = useMemo<Mention[]>(
    () => parseMentions(draftValue, workspace.registry),
    [draftValue, workspace.registry],
  )
  const mentionAtCursor = useMemo(
    () =>
      mentionPreview.find(
        (mention) => caretIndex >= mention.start && caretIndex <= mention.end,
      ) ?? null,
    [caretIndex, mentionPreview],
  )
  const activeMention = useMemo(
    () => getActiveMention(draftValue, caretIndex),
    [caretIndex, draftValue],
  )
  const deferredMentionQuery = useDeferredValue(activeMention?.query ?? '')
  const mentionSuggestions = useMemo(
    () => suggestMentions(deferredMentionQuery, workspace.registry),
    [deferredMentionQuery, workspace.registry],
  )

  useEffect(() => {
    onFocusEntity(mentionAtCursor?.entityId ?? null)
  }, [mentionAtCursor?.entityId, onFocusEntity])

  function applyMentionSuggestion(entityId: string) {
    const textarea = textareaRef.current
    const cursor = textarea?.selectionStart ?? caretIndex
    const nextValue = replaceActiveMention(draftValue, cursor, entityId)
    onDraftChange(nextValue.nextValue)
    requestAnimationFrame(() => {
      textarea?.focus()
      textarea?.setSelectionRange(nextValue.nextCursorIndex, nextValue.nextCursorIndex)
      setCaretIndex(nextValue.nextCursorIndex)
    })
  }

  function insertTranscriptIntoDraft() {
    if (!voiceTranscript.trim()) {
      return
    }

    const nextValue = draftValue.trim()
      ? `${draftValue.trim()}\n\n${voiceTranscript.trim()}`
      : voiceTranscript.trim()
    onDraftChange(nextValue)
  }

  function handleSave() {
    onSaveMemo({
      transcriptSource: voiceTranscript.trim() || null,
      transcriptReviewed:
        Boolean(voiceTranscript.trim()) && draftValue.includes(voiceTranscript.trim()),
    })
  }

  return (
    <PanelFrame className="flex min-h-[420px] flex-col overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-body-border px-4 py-3">
        <div className="space-y-1">
          <p className="mono-label">Workspace Notes</p>
          <h2 className="text-lg font-semibold">
            {selectedThread?.title ?? selectedEntity?.label ?? 'Annotation Workspace'}
          </h2>
          <p className="text-sm text-body-muted">
            {workspace.project.title} inside {workspace.actionInstance.title}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {selectedEntity && (
            <AuthorityBadge grade={selectedEntity.authorityGrade} compact />
          )}
          <span className="rounded-full border border-body-border px-3 py-1 text-sm text-body-muted">
            {activeMemoType === 'global' ? 'Global Memo' : `Keyframed @ ${targetFrame}`}
          </span>
          <span className="rounded-full border border-body-border px-3 py-1 text-sm text-body-muted">
            Save {saveStatus}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-4">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="subtle-card p-4">
            <p className="mono-label">Prototype Metadata</p>
            <dl className="mt-3 space-y-3 text-sm">
              <div>
                <dt className="text-body-muted">Prototype Entity</dt>
                <dd className="mt-1 font-mono text-[13px]">
                  {selectedThread?.targetEntityId ?? selectedEntity?.id ?? 'No selection'}
                </dd>
              </div>
              <div>
                <dt className="text-body-muted">Anchor Id</dt>
                <dd className="mt-1 font-mono text-[13px]">
                  {selectedThread?.anchorId ?? selectedEntity?.anchorId ?? 'No anchor'}
                </dd>
              </div>
            </dl>
          </div>

          <div className="subtle-card p-4">
            <p className="mono-label">Display Track</p>
            <dl className="mt-3 space-y-3 text-sm">
              <div>
                <dt className="text-body-muted">Memo Track</dt>
                <dd className="mt-1">
                  {activeMemoType === 'global'
                    ? 'Persistent across all frames'
                    : `Keyframed at ${targetFrame}`}
                </dd>
              </div>
              <div>
                <dt className="text-body-muted">Camera View</dt>
                <dd className="mt-1 font-mono text-[13px]">
                  {fallbackCameraViewId}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <NotionButton
            tone={activeMemoType === 'global' ? 'active' : 'default'}
            onClick={() => onChangeMemoType('global')}
          >
            Global Memo
          </NotionButton>
          <NotionButton
            tone={activeMemoType === 'keyframed' ? 'active' : 'default'}
            onClick={() => onChangeMemoType('keyframed')}
          >
            Keyframed Memo
          </NotionButton>
          <NotionButton onClick={handleSave} disabled={!selectedEntity && !selectedThread}>
            Save Memo
          </NotionButton>
        </div>

        {!selectedThread && (
          <div className="subtle-card flex flex-col gap-3 p-4">
            <p className="text-sm leading-6 text-body-text">
              {getEmptyStateMessage(selectedEntity)}
            </p>
            <div>
              <NotionButton
                tone="active"
                disabled={!canCreateThreadFromSelection}
                onClick={onCreateThreadFromSelection}
              >
                {canCreateThreadFromSelection
                  ? 'Create Thread From Prototype'
                  : 'Select a prototype entity first'}
              </NotionButton>
            </div>
          </div>
        )}

        <div className="panel-surface flex flex-1 flex-col p-4">
          <label className="mono-label" htmlFor="annotation-editor">
            Note Body
          </label>
          <textarea
            ref={textareaRef}
            id="annotation-editor"
            className="editor-textarea mt-4"
            placeholder="Add a note here, or use an @token from the parked Body Note prototype."
            value={draftValue}
            onChange={(event) => {
              onDraftChange(event.currentTarget.value)
              setCaretIndex(event.currentTarget.selectionStart)
            }}
            onClick={(event) => setCaretIndex(event.currentTarget.selectionStart)}
            onKeyUp={(event) => setCaretIndex(event.currentTarget.selectionStart)}
          />

          <div className="mt-4 flex flex-wrap gap-2">
            {mentionSuggestions.map((suggestion) => (
              <button
                key={suggestion.entityId}
                type="button"
                className="rounded-full border border-body-border bg-body-surface px-3 py-1.5 text-left text-[12px] text-body-text transition-colors hover:bg-[rgba(55,53,47,0.08)]"
                onMouseEnter={() => onFocusEntity(suggestion.entityId)}
                onMouseLeave={() => onFocusEntity(null)}
                onClick={() => applyMentionSuggestion(suggestion.entityId)}
              >
                <span className="font-mono">{suggestion.token}</span>
                <span className="ml-2 text-body-muted">{suggestion.label}</span>
              </button>
            ))}
          </div>
        </div>

        {(inputMode !== 'text' || voiceTranscript || voiceError) && (
          <div className="subtle-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="mono-label">Voice Capture</p>
                <p className="mt-2 text-sm leading-6 text-body-muted">
                  Use browser speech recognition first, then confirm before saving the
                  transcript into the memo.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <NotionButton
                  tone="active"
                  disabled={!voiceSupported || voiceListening}
                  onClick={onStartVoice}
                >
                  Start Mic
                </NotionButton>
                <NotionButton disabled={!voiceListening} onClick={onStopVoice}>
                  Stop
                </NotionButton>
                <NotionButton disabled={!voiceTranscript.trim()} onClick={insertTranscriptIntoDraft}>
                  Insert Transcript
                </NotionButton>
                <NotionButton onClick={onResetVoice}>Reset</NotionButton>
              </div>
            </div>

            {!voiceSupported && (
              <p className="mt-3 text-sm text-body-text">
                This browser does not expose speech recognition. Text mode stays available.
              </p>
            )}

            {(voiceTranscript || voiceInterimTranscript) && (
              <div className="mt-4 rounded-[8px] border border-body-border bg-white px-3 py-3 text-sm leading-7 text-body-text">
                <p className="font-medium">Transcript Review</p>
                <p className="mt-2 whitespace-pre-wrap">
                  {voiceTranscript || 'Listening...'}
                  {voiceInterimTranscript && (
                    <span className="text-body-muted"> {voiceInterimTranscript}</span>
                  )}
                </p>
              </div>
            )}

            {voiceTranscript.trim() && draftValue.includes(voiceTranscript.trim()) && (
              <p className="mt-3 text-sm text-body-muted">
                Transcript inserted. Saving the memo will mark it as reviewed.
              </p>
            )}

            {voiceError && (
              <p className="mt-3 text-sm text-body-text">{voiceError}</p>
            )}
          </div>
        )}

        <div className="subtle-card p-4">
          <p className="mono-label">Mention Preview</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {mentionPreview.length === 0 && (
              <span className="text-sm text-body-muted">
                Mentions will appear here after you add @tokens.
              </span>
            )}
            {mentionPreview.map((mention) => (
              <button
                key={`${mention.entityId}-${mention.start}`}
                type="button"
                className="rounded-full border border-body-border bg-white px-3 py-1.5 font-mono text-[12px] text-body-text"
                onMouseEnter={() => onFocusEntity(mention.entityId)}
                onMouseLeave={() => onFocusEntity(null)}
              >
                {mention.token}
              </button>
            ))}
          </div>
          <p className="mt-3 text-sm leading-6 text-body-muted">
            {currentMemo
              ? `Current memo last saved at ${new Date(currentMemo.updatedAt).toLocaleString()}.`
              : 'This memo has not been saved yet.'}
          </p>
        </div>
      </div>
    </PanelFrame>
  )
}
