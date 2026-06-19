import { AuthorityBadge } from '../../components/AuthorityBadge'
import { NotionButton } from '../../components/NotionButton'
import { PanelFrame } from '../../components/PanelFrame'
import { useWorkspaceStore } from '../../stores/useWorkspaceStore'
import { threadCatalog, workspaceSummary } from '../../stores/workspaceSeed'

export function AnnotationEditor() {
  const selectedThreadId = useWorkspaceStore((state) => state.selectedThreadId)
  const editorDrafts = useWorkspaceStore((state) => state.editorDrafts)
  const updateDraft = useWorkspaceStore((state) => state.updateDraft)

  const selectedThread =
    threadCatalog.find((thread) => thread.id === selectedThreadId) ??
    threadCatalog[0]

  const draftValue = editorDrafts[selectedThread.id]
  const authorityGrade = selectedThread.targetEntityId.startsWith('meridian')
    ? 'C'
    : selectedThread.targetEntityId.startsWith('ligament')
      ? 'B'
      : 'A'

  return (
    <PanelFrame className="flex min-h-[420px] flex-col overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-body-border px-4 py-3">
        <div className="space-y-1">
          <p className="mono-label">Center-right Annotation Editor</p>
          <h2 className="text-lg font-semibold">{selectedThread.title}</h2>
          <p className="text-sm text-body-muted">
            {workspaceSummary.actionInstance} 기준 노션 스타일 메모 영역
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <AuthorityBadge grade={authorityGrade} compact />
          <span className="rounded-full border border-body-border px-3 py-1 text-sm text-body-muted">
            {selectedThread.memoMode}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-4">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="subtle-card p-4">
            <p className="mono-label">Thread Metadata</p>
            <dl className="mt-3 space-y-3 text-sm">
              <div>
                <dt className="text-body-muted">Target Entity</dt>
                <dd className="mt-1 font-mono text-[13px]">
                  {selectedThread.targetEntityId}
                </dd>
              </div>
              <div>
                <dt className="text-body-muted">Anchor Id</dt>
                <dd className="mt-1 font-mono text-[13px]">{selectedThread.anchorId}</dd>
              </div>
            </dl>
          </div>

          <div className="subtle-card p-4">
            <p className="mono-label">Display Track</p>
            <dl className="mt-3 space-y-3 text-sm">
              <div>
                <dt className="text-body-muted">Frame Window</dt>
                <dd className="mt-1">{selectedThread.frameWindow}</dd>
              </div>
              <div>
                <dt className="text-body-muted">Camera View</dt>
                <dd className="mt-1 font-mono text-[13px]">
                  {selectedThread.cameraViewId}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <NotionButton tone="active">Editor</NotionButton>
          <NotionButton>
            {selectedThread.memoMode === 'Global Memo'
              ? 'Persistent Note'
              : 'Keyframed Memo'}
          </NotionButton>
          <NotionButton>Comment Stub</NotionButton>
        </div>

        <div className="panel-surface flex flex-1 flex-col p-4">
          <label className="mono-label" htmlFor="annotation-editor">
            Annotation Body
          </label>
          <textarea
            id="annotation-editor"
            className="editor-textarea mt-4"
            placeholder="@muscle.gluteus_maximus.R 처럼 구조를 직접 언급해 메모를 시작하세요."
            value={draftValue}
            onChange={(event) =>
              updateDraft(selectedThread.id, event.currentTarget.value)
            }
          />
        </div>

        <div className="subtle-card p-4">
          <p className="mono-label">Mention Preview</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {selectedThread.mentions.map((mention) => (
              <span
                key={mention}
                className="rounded-full border border-body-border bg-white px-3 py-1.5 font-mono text-[12px] text-body-text"
              >
                {mention}
              </span>
            ))}
          </div>
          <p className="mt-3 text-sm leading-6 text-body-muted">
            입력한 `@mention`은 추후 3D 하이라이트와 카메라 이동 규칙으로 연결될 준비 상태입니다.
          </p>
        </div>
      </div>
    </PanelFrame>
  )
}
