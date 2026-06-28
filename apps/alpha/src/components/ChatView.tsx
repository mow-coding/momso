'use client'

import { useEffect, useRef, useState } from 'react'
import { useDB, addZet, chatAsk, getLlmConfigured, type RagSource } from '../lib/store'

type View = 'home' | 'upload' | 'review' | 'chat' | 'wiki' | 'settings'

/** 예시 질문 — 클릭 시 입력만 채운다(전송은 사용자 확정). */
const SAMPLE_QUESTIONS = [
  '고관절을 여는 시퀀스 정리해줘',
  '회원들이 자주 막히는 자세는?',
  '지난 수업의 호흡 큐를 모아줘',
]

/** 한 차례 대화 — 사용자 질문 + 몸이 답변(+회수 출처). source_id 단축 표기에 쓰임. */
type Turn = {
  id: string
  question: string
  answer: string
  sources: RagSource[]
}

const shortId = (id: string) => id.slice(0, 8)
const sourceLabel = (s: RagSource) => (s.sourceType === 'objet' ? '원본' : '위키')

/**
 * ChatView — 길B(대화발). 실제 RAG 대화(chatAsk) + 답변에 출처(source-tag) 동반.
 * 무결성: 가짜 응답 0. AI는 회수된 근거만 인용 → sources를 source-tag로 항상 노출.
 * 키 미설정 = 정직한 준비 상태(SettingsView로 유도). 만족 시 한 번에 위키 발행(addZet).
 * 키가 없어도 수동 발행 우회로는 항상 가능.
 */
export default function ChatView({ onNavigate }: { onNavigate?: (v: View) => void }) {
  const db = useDB()
  const published = db.zets.filter((z) => z.status === 'published')

  // ── BYOK 설정 여부(서버 GET /api/byok — 키 비반환, 존재 여부만) ──
  const [configured, setConfigured] = useState<boolean | null>(null)
  useEffect(() => {
    let alive = true
    getLlmConfigured()
      .then((ok) => alive && setConfigured(ok))
      .catch(() => alive && setConfigured(false))
    return () => {
      alive = false
    }
  }, [])

  // ── 대화 상태(클라) ──
  const [question, setQuestion] = useState('')
  const [turns, setTurns] = useState<Turn[]>([])
  const [asking, setAsking] = useState(false)
  const [askError, setAskError] = useState<string | null>(null)

  const canAsk = configured === true && Boolean(question.trim()) && !asking

  // 새 답변이 붙으면 캔버스 하단으로.
  const endRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [turns.length, asking])

  async function ask() {
    const q = question.trim()
    if (!q || asking || configured !== true) return
    setAsking(true)
    setAskError(null)
    // 직전 대화를 모델 history로 전달(무결성 system은 서버가 주입).
    const history = turns.flatMap((t) => [
      { role: 'user' as const, content: t.question },
      { role: 'assistant' as const, content: t.answer },
    ])
    try {
      const { answer, sources } = await chatAsk(q, history)
      setTurns((prev) => [
        ...prev,
        { id: crypto.randomUUID(), question: q, answer, sources: sources ?? [] },
      ])
      setQuestion('')
    } catch (e) {
      console.error('chatAsk', e)
      setAskError('답변을 가져오지 못했어요. 잠시 후 다시 시도해 주세요.')
    } finally {
      setAsking(false)
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void ask()
    }
  }

  // 수동 발행 미니폼(정직한 우회로 — 키 없이도 가능).
  const [composeOpen, setComposeOpen] = useState(false)
  const [pubTitle, setPubTitle] = useState('')
  const [pubBody, setPubBody] = useState('')
  const [saving, setSaving] = useState(false)

  const canPublish = Boolean(pubTitle.trim() && pubBody.trim()) && !saving

  async function publish() {
    if (!canPublish) return
    setSaving(true)
    const z = await addZet({
      title: pubTitle.trim(),
      body: pubBody.trim(),
      source: 'chat',
      status: 'published',
    })
    setSaving(false)
    if (z) {
      setPubTitle('')
      setPubBody('')
      setComposeOpen(false)
    }
  }

  // 대화 답변을 한 번에 위키로 발행(source:'chat', published). 출처는 검수 파이프라인 영속이므로
  // 본문에 인라인 인용(원본/위키 #id)을 같이 담아 귀속을 잃지 않는다.
  const [publishingId, setPublishingId] = useState<string | null>(null)
  async function publishTurn(t: Turn) {
    if (publishingId) return
    if (t.sources.length === 0) return // 무근거 답변은 위키 발행 불가(§3 — 근거 없으면 사람 노출 금지)
    setPublishingId(t.id)
    const cite =
      t.sources.length > 0
        ? '\n\n— 근거: ' + t.sources.map((s) => `${sourceLabel(s)} #${shortId(s.sourceId)}`).join(', ')
        : ''
    const z = await addZet({
      title: t.question,
      body: t.answer + cite,
      source: 'chat',
      status: 'published',
    })
    setPublishingId(null)
    if (z) {
      // 발행 표식 — 같은 turn을 한 번만 발행하도록 sources를 비워 버튼 잠금 신호로 쓰지 않고
      // 별도 published 집합으로 관리.
      setPublishedTurns((prev) => new Set(prev).add(t.id))
    }
  }
  const [publishedTurns, setPublishedTurns] = useState<Set<string>>(() => new Set())

  const hasConversation = turns.length > 0

  return (
    <div className="mx-auto flex h-full max-w-3xl flex-col">
      {/* ① 대화 캔버스 — flex-1. 빈상태 = 무결성 약속 + 실데이터 + 우회로. */}
      <div className="flex-1 space-y-8 overflow-y-auto pb-6">
        {/* 위키 컨텍스트 줄 — 실데이터일 때만. */}
        {published.length > 0 && (
          <p className="text-sm text-body-muted">
            이 위키로 답합니다 <span className="text-body-border">·</span>{' '}
            <span className="font-medium text-body-text">{published.length}개 리포트</span> 발행됨
          </p>
        )}

        {!hasConversation && (
          <section className="empty-state">
            <h2 className="empty-state-title">무엇이든 물어보세요</h2>
            <span className="accent-rule mt-3" />
            <p className="empty-state-body mt-4 max-w-prose">
              답이 마음에 들면 한 번에 위키로 발행됩니다. 빈 위키에서도 대화로 시작할 수 있고,
              기록이 쌓일수록 더 정확해져요.
            </p>

            {/* 예시 질문 — 클릭=입력 채움. */}
            <div className="mt-5 flex flex-wrap gap-2">
              {SAMPLE_QUESTIONS.map((q) => (
                <button
                  key={q}
                  type="button"
                  className="meta-chip transition-colors hover:bg-sage"
                  onClick={() => setQuestion(q)}
                >
                  {q}
                </button>
              ))}
            </div>

            {/* 무결성 약속 — AI 단정 인접 규약. */}
            <div className="mt-6 border-t border-body-border pt-5">
              <p className="text-[13px] leading-relaxed text-body-muted">
                답변에는 회수된 <span className="source-tag">출처</span> 와 화자 라벨이 함께
                붙습니다. AI는 원본까지 보지만, 근거가 없으면 단정하지 않고 &lsquo;불명&rsquo;이라
                답해요.
              </p>
              {published.length === 0 && (
                <p className="mt-3 text-[13px] leading-relaxed text-body-muted">
                  아직 발행된 위키가 없어요.{' '}
                  <button
                    type="button"
                    className="empty-state-link"
                    onClick={() => onNavigate?.('upload')}
                  >
                    수업 기록 올리기
                  </button>
                  부터 시작하거나, 빈 위키에서도 바로 물어볼 수 있습니다.
                </p>
              )}
            </div>
          </section>
        )}

        {/* 대화 턴 — 사용자 질문 + 몸이 답변 + 출처 칩. */}
        {turns.map((t) => {
          const done = publishedTurns.has(t.id)
          return (
            <div key={t.id} className="space-y-3">
              {/* 사용자 질문 — 우측 정렬 말풍선 */}
              <div className="flex justify-end">
                <p className="max-w-[85%] rounded-[10px] bg-sage px-3 py-2 text-[15px] leading-relaxed text-body-text">
                  {t.question}
                </p>
              </div>

              {/* 몸이 답변 + 출처 + 발행 */}
              <div className="panel space-y-3 p-4">
                <p className="reading-body whitespace-pre-wrap">{t.answer}</p>

                {t.sources.length > 0 ? (
                  <div className="flex flex-wrap items-center gap-1.5 border-t border-body-border pt-3">
                    {t.sources.map((s) => (
                      <span key={`${s.sourceType}-${s.sourceId}`} className="source-tag">
                        {sourceLabel(s)} #{shortId(s.sourceId)}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="border-t border-body-border pt-3 text-[12px] leading-relaxed text-body-muted">
                    이 답변을 뒷받침할 위키 근거를 찾지 못했어요. 수업 기록을 더 올리면 출처와 함께
                    답합니다.
                  </p>
                )}

                <div className="flex items-center gap-2">
                  {done ? (
                    <span className="meta-chip">
                      <span aria-hidden className="status-dot-published" />
                      위키에 발행됨
                    </span>
                  ) : t.sources.length > 0 ? (
                    <button
                      type="button"
                      className="btn btn-primary px-3 py-1.5 text-[13px]"
                      disabled={publishingId === t.id}
                      onClick={() => publishTurn(t)}
                    >
                      {publishingId === t.id ? '발행 중…' : '위키로 발행'}
                    </button>
                  ) : (
                    <span className="text-[12px] text-body-muted">
                      근거가 없어 위키 발행은 잠겨 있어요(무결성).
                    </span>
                  )}
                </div>
              </div>
            </div>
          )
        })}

        {asking && (
          <div className="panel flex items-center gap-2 p-4 text-sm text-body-muted">
            <span aria-hidden className="accent-dot animate-pulse" />
            위키와 원본을 살펴보는 중…
          </div>
        )}

        <div ref={endRef} />
      </div>

      {/* ② 하단 입력 바 — 키 설정 시 활성. 미설정이면 설정 유도. */}
      <div className="sticky bottom-0 space-y-2 bg-body-bg pt-2">
        <div className="panel flex items-end gap-2 p-2">
          <textarea
            className="max-h-32 min-h-[44px] flex-1 resize-none rounded-[6px] bg-transparent px-2 py-2 text-[15px] leading-relaxed text-body-text outline-none placeholder:text-body-muted disabled:cursor-not-allowed disabled:opacity-60"
            rows={1}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={onKeyDown}
            disabled={configured !== true || asking}
            placeholder={
              configured === false
                ? 'AI 키를 설정하면 바로 대화할 수 있어요'
                : '예: 고관절을 여는 시퀀스 정리해줘'
            }
            aria-label="몸이에게 묻기"
          />
          <button
            type="button"
            className="btn btn-primary shrink-0"
            disabled={!canAsk}
            onClick={() => void ask()}
            aria-label="전송"
          >
            {asking ? '…' : '보내기'}
          </button>
        </div>

        {/* 상태 줄 — 정직: 미설정/에러는 그대로. */}
        {askError ? (
          <p className="px-1 text-[12px] leading-relaxed text-accent-strong">{askError}</p>
        ) : configured === false ? (
          <p className="px-1 text-[12px] leading-relaxed text-body-muted">
            대화하려면 먼저{' '}
            <button type="button" className="empty-state-link" onClick={() => onNavigate?.('settings')}>
              설정에서 AI 키 연결
            </button>
            이 필요해요. 키 없이도 아래에서 직접 발행할 수 있습니다.
          </p>
        ) : configured === null ? (
          <p className="px-1 text-[12px] leading-relaxed text-body-muted">연결 상태 확인 중…</p>
        ) : (
          <p className="px-1 text-[12px] leading-relaxed text-body-muted">
            답변에는 회수된 출처가 함께 붙어요. Enter로 전송, Shift+Enter로 줄바꿈.
          </p>
        )}
      </div>

      {/* ③ 직접 발행 — 키 없이도 가능한 정직한 동선(실제 addZet). */}
      <div className="mt-8">
        <div className="section-head">
          <span className="section-head-title">직접 위키로 발행</span>
          {!composeOpen && (
            <button
              type="button"
              className="btn btn-ghost px-2 py-1 text-[13px]"
              onClick={() => setComposeOpen(true)}
            >
              한 편 쓰기
            </button>
          )}
        </div>

        {composeOpen ? (
          <div className="panel mt-3 space-y-3 p-5">
            <label className="block">
              <span className="field-label">제목</span>
              <input
                className="field-input"
                value={pubTitle}
                onChange={(e) => setPubTitle(e.target.value)}
                placeholder="예: 고관절 여는 3단계"
              />
            </label>
            <label className="block">
              <span className="field-label">본문</span>
              <textarea
                className="field-area reading-body"
                value={pubBody}
                onChange={(e) => setPubBody(e.target.value)}
                placeholder="예: 누운 비둘기 → 도마뱀 → 낮은 런지로 이어 고관절을 단계적으로 연다."
              />
            </label>
            <p className="text-[12px] leading-relaxed text-body-muted">
              대화발 리포트로 위키에 바로 발행됩니다. 검수된 출처가 붙는 건 보정본 파이프라인을 거친
              발행이고, 직접 작성분은 본문 그대로 발행돼요.
            </p>
            <div className="flex items-center gap-2">
              <button type="button" className="btn btn-primary" disabled={!canPublish} onClick={publish}>
                {saving ? '발행 중…' : '위키로 발행'}
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setComposeOpen(false)}
                disabled={saving}
              >
                취소
              </button>
            </div>
          </div>
        ) : published.length === 0 ? (
          <div className="empty-state-tight mt-3">
            <p className="empty-state-body">
              아직 발행된 리포트가 없어요.{' '}
              <button type="button" className="empty-state-link" onClick={() => setComposeOpen(true)}>
                직접 한 편
              </button>
              을 발행해 위키를 시작할 수 있습니다.
            </p>
          </div>
        ) : (
          <ul className="mt-3 space-y-2">
            {published.slice(0, 4).map((z) => (
              <li key={z.id} className="list-row">
                <span className="list-row-title">{z.title}</span>
                <span className="flex shrink-0 items-center gap-2">
                  <span className="status-dot-published" aria-hidden />
                  <span className="list-row-meta">
                    {new Date(z.publishedAt ?? z.createdAt).toLocaleDateString('ko-KR')}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}