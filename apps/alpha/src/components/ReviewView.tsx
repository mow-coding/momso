'use client'

import { useEffect, useState } from 'react'
import {
  useDB,
  addZet,
  updateZet,
  correctObjet,
  extractFocuses,
  saveCorrected,
  confirmSpeaker,
  getLlmConfigured,
  isClassKind,
  FILE_KINDS,
  type Objet,
  type Zet,
  type SpeakerMap,
  type TermFix,
  type Focus,
  type SourceRef,
} from '../lib/store'

type View = 'home' | 'upload' | 'review' | 'chat' | 'wiki' | 'settings'

const kindLabel = (o: Objet) => FILE_KINDS.find((k) => k.key === o.kind)?.label ?? o.kind
const fmtDate = (ts: number) => new Date(ts).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })

/* ── 화자 역할 라벨/칩 (무결성: 정체는 '제안', 확신 없으면 불명) ───── */
type Role = Focus['speakerRole'] // 'member' | 'teacher' | 'excluded' | 'unknown'

const ROLE_LABEL: Record<Role, string> = {
  member: '회원',
  teacher: '강사',
  excluded: '제외',
  unknown: '불명',
}

const rolePillClass = (role: Role) =>
  role === 'member' ? 'pill-member' : role === 'teacher' ? 'pill-teacher' : 'pill-excluded'

const speakerRoleLabel = (role: SpeakerMap['role']) =>
  role === 'member' ? '회원' : role === 'teacher' ? '강사' : '불명'

const speakerPillClass = (role: SpeakerMap['role']) =>
  role === 'member' ? 'pill-member' : role === 'teacher' ? 'pill-teacher' : 'pill-excluded'

/**
 * 길A 무결성 게이트 — 전사본 → 보정본 → AI 초점 검수 → 발행.
 * 진짜 동작: correctObjet(L2) → extractFocuses(L3) → 사람이 칩 확정 → addZet(class, published).
 * 무결성: 모든 초점에 화자 + 출처(스팬). 근거 없는 초점은 서버에서 이미 제외됨.
 * LLM 미설정이면 정직하게 설정으로 유도(가짜 보정/초점 0).
 */
export default function ReviewView({ onNavigate }: { onNavigate?: (v: View) => void }) {
  const db = useDB()

  // 실데이터만: 검수 후보가 될 수 있는 전사본 계열 objet.
  const classObjets = db.objets.filter((o) => isClassKind(o.kind))
  // 실데이터만: 이미 만들어진 초안 zet(검수 대기) — 진짜 검수·발행 가능.
  const drafts = db.zets.filter((z) => z.status === 'draft')

  // LLM 키 설정 여부(보정·초점은 키 필요). null = 확인 중.
  const [llmReady, setLlmReady] = useState<boolean | null>(null)
  useEffect(() => {
    let alive = true
    getLlmConfigured()
      .then((ok) => alive && setLlmReady(ok))
      .catch(() => alive && setLlmReady(false))
    return () => {
      alive = false
    }
  }, [])

  return (
    <div className="max-w-5xl space-y-8">
      {/* 검수 대기 초안(zet) — 진짜 동작: 발행 가능. 있을 때만 노출. */}
      {drafts.length > 0 && <DraftQueue drafts={drafts} />}

      {/* 본체 — 후보 0이면 빈상태(a), 있으면 보정→초점→발행 작업대(b) */}
      {classObjets.length === 0 ? (
        <NoCandidates onNavigate={onNavigate} hasDrafts={drafts.length > 0} />
      ) : (
        <Workbench objets={classObjets} llmReady={llmReady} onNavigate={onNavigate} />
      )}
    </div>
  )
}

/* ── 진짜 동작: 초안 zet 검수·발행 ───────────────────────────── */

function DraftQueue({ drafts }: { drafts: Zet[] }) {
  return (
    <section className="space-y-3">
      <div className="section-head">
        <h2 className="section-head-title">
          검수 대기 초안 <span className="section-head-count">· {drafts.length}</span>
        </h2>
      </div>
      <p className="text-sm leading-relaxed text-body-muted">
        대화에서 만들어진 초안입니다. 내용을 확인하고 발행하면 위키 본문이 됩니다.
      </p>
      <ul className="space-y-2">
        {drafts.map((z) => (
          <DraftRow key={z.id} zet={z} />
        ))}
      </ul>
    </section>
  )
}

function DraftRow({ zet }: { zet: Zet }) {
  const [busy, setBusy] = useState(false)

  async function publish() {
    if (busy) return
    setBusy(true)
    await updateZet(zet.id, { status: 'published' })
    // 발행되면 drafts 필터에서 빠져 행이 사라짐 → 상태 복구 불필요.
  }

  return (
    <li className="panel flex items-center justify-between gap-3 p-3 text-sm">
      <div className="flex min-w-0 items-center gap-2">
        <span className="status-dot-draft" aria-hidden />
        <span className="truncate font-medium text-body-text">{zet.title}</span>
        <span className="meta-chip shrink-0">{zet.source === 'class' ? '수업발' : '대화발'}</span>
      </div>
      <button className="btn btn-primary shrink-0" disabled={busy} onClick={publish}>
        {busy ? '발행 중…' : '발행'}
      </button>
    </li>
  )
}

/* ── 빈상태 (a): 검수 후보(전사본) 0 ─────────────────────────── */

function NoCandidates({ onNavigate, hasDrafts }: { onNavigate?: (v: View) => void; hasDrafts: boolean }) {
  return (
    <section className="empty-state space-y-4">
      <div className="space-y-3">
        <h2 className="empty-state-title">검수할 수업 기록이 아직 없습니다</h2>
        <span className="accent-rule" aria-hidden />
      </div>
      <p className="empty-state-body max-w-prose">
        검수는 수업 전사본에서 시작합니다. 먼저 전사본을 올려두면, 보정과 초점 추출을 거쳐 이 작업대로
        올라옵니다.
        {!hasDrafts && ' 대화에서 만든 초안이 있으면 여기에서 바로 검수·발행할 수도 있습니다.'}
      </p>
      <button className="empty-state-link" onClick={() => onNavigate?.('upload')}>
        업로드로 원본 모으기
      </button>
    </section>
  )
}

/* ── 작업대 (b): 후보 선택 → 보정 → 초점 검수 → 발행 ─────────── */

type Stage = 'pick' | 'correcting' | 'corrected' | 'extracting' | 'reviewing'

/** 검수 칩의 클라 상태 — 서버 Focus + 사람이 정하는 역할/포함. */
type ReviewFocus = Focus & { include: boolean }

function Workbench({
  objets,
  llmReady,
  onNavigate,
}: {
  objets: Objet[]
  llmReady: boolean | null
  onNavigate?: (v: View) => void
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [stage, setStage] = useState<Stage>('pick')
  const [error, setError] = useState<string | null>(null)

  // 보정(L2) 결과
  const [corrected, setCorrected] = useState('')
  const [speakerMap, setSpeakerMap] = useState<SpeakerMap[]>([])
  const [terms, setTerms] = useState<TermFix[]>([])
  // §4 보정본(L2) 영속 id — 발행 시 계보(zet.corrected_id)로 연결.
  const [correctedId, setCorrectedId] = useState<string | null>(null)

  // 초점(L3) 결과 + 사람 확정 상태
  const [focuses, setFocuses] = useState<ReviewFocus[]>([])

  // 발행
  const [publishing, setPublishing] = useState(false)
  const [published, setPublished] = useState(false)

  const selected = objets.find((o) => o.id === selectedId) ?? null

  function reset() {
    setSelectedId(null)
    setStage('pick')
    setError(null)
    setCorrected('')
    setSpeakerMap([])
    setTerms([])
    setCorrectedId(null)
    setFocuses([])
    setPublishing(false)
    setPublished(false)
  }

  async function startCorrect(o: Objet) {
    if (!o.body || !o.body.trim()) {
      setSelectedId(o.id)
      setStage('pick')
      setError('이 기록에는 보정할 전사 본문이 없습니다. 본문이 있는 전사본을 올려 주세요.')
      return
    }
    setSelectedId(o.id)
    setError(null)
    setPublished(false)
    setFocuses([])
    setStage('correcting')
    try {
      const r = await correctObjet(o.id)
      setCorrected(r.corrected)
      setSpeakerMap(r.speakerMap)
      setTerms(r.terms)
      // §4: 보정본(L2)을 영속 + 보정추적 로깅(발행 계보용 corrected_id 확보). best-effort.
      const cid = await saveCorrected({
        objetId: o.id,
        correctedBody: r.corrected,
        speakerMap: r.speakerMap,
        terms: r.terms,
      })
      setCorrectedId(cid)
      setStage('corrected')
    } catch (e) {
      console.error('correctObjet', e)
      setError('보정에 실패했습니다. AI 키 설정과 네트워크를 확인해 주세요.')
      setStage('pick')
    }
  }

  async function runExtract() {
    if (!selected) return
    setError(null)
    setStage('extracting')
    try {
      // 보정본 기준으로 초점 추출(무결성: 근거 없는 조각은 서버에서 제외).
      const r = await extractFocuses({ correctedText: corrected, objetId: selected.id })
      setFocuses(r.focuses.map((f) => ({ ...f, include: f.speakerRole !== 'excluded' && f.speakerRole !== 'unknown' })))
      setStage('reviewing')
    } catch (e) {
      console.error('extractFocuses', e)
      setError('초점 추출에 실패했습니다. 잠시 후 다시 시도해 주세요.')
      setStage('corrected')
    }
  }

  function setFocusRole(idx: number, role: Role) {
    setFocuses((prev) =>
      prev.map((f, i) =>
        i === idx
          ? { ...f, speakerRole: role, include: role === 'excluded' || role === 'unknown' ? false : f.include }
          : f,
      ),
    )
  }

  function toggleInclude(idx: number) {
    setFocuses((prev) => prev.map((f, i) => (i === idx ? { ...f, include: !f.include } : f)))
  }

  const includedCount = focuses.filter((f) => f.include).length

  async function publish() {
    if (!selected || publishing || includedCount === 0) return
    setPublishing(true)
    setError(null)
    // 무결성: 확정된 초점만 발행. 각 조각에 화자 라벨 + 출처 스팬을 본문에 보존.
    const included = focuses.filter((f) => f.include)
    const body = included
      .map((f) => `[${ROLE_LABEL[f.speakerRole]}] ${f.text}\n출처: ${f.sourceSpan}`)
      .join('\n\n')
    // §3 구조화 출처(주장별 근거 스팬) + §4 계보(corrected_id)를 발행물에 영속 → post-publish 감사 가능.
    const sourceRefs: SourceRef[] = included.map((f) => ({ span: f.sourceSpan, role: f.speakerRole }))
    const z = await addZet({
      title: selected.title,
      body,
      source: 'class',
      status: 'published',
      objetId: selected.id,
      correctedId: correctedId ?? undefined,
      sourceRefs,
    })
    setPublishing(false)
    if (z) {
      setPublished(true)
      setStage('reviewing')
    } else {
      setError('발행에 실패했습니다. 다시 시도해 주세요.')
    }
  }

  const busy = stage === 'correcting' || stage === 'extracting'

  return (
    <section className="space-y-8">
      {/* 작업대 헤더 — 정직한 한 줄 + 시그니처 밑줄. 키 미설정이면 설정 유도. */}
      <div className="empty-state space-y-5">
        <div className="space-y-3">
          <h2 className="empty-state-title">수업 기록을 보정하고 초점을 검수합니다</h2>
          <span className="accent-rule" aria-hidden />
        </div>
        <p className="empty-state-body max-w-prose">
          전사본을 고르면 몸소 딕셔너리로 용어·화자를 보정하고, AI가 뽑은 대화 초점을 조각별로 확인해
          발행합니다. 근거 없는 초점은 만들지 않습니다 — 모든 조각에 화자와 출처가 함께 붙습니다.
        </p>

        {llmReady === false && (
          <div className="panel-muted space-y-2 p-5">
            <p className="text-[13px] leading-relaxed text-body-muted">
              보정과 초점 추출에는 AI 키가 필요합니다. 아직 연결되지 않았어요.
            </p>
            <button className="empty-state-link" onClick={() => onNavigate?.('settings')}>
              설정에서 AI 키 연결하기
            </button>
          </div>
        )}

        {/* 무결성 약속 — 화자 칩 + 출처 동반 규약(미리보기) */}
        <div className="panel-muted space-y-3 p-5">
          <p className="text-[13px] leading-relaxed text-body-muted">
            검수 화면에서 모든 초점에는 <span className="font-medium text-body-text">화자</span>와{' '}
            <span className="font-medium text-body-text">출처</span>가 항상 함께 붙습니다. AI는 원본까지
            보지만, 위키에는 검수된 것만 올라갑니다.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <span className="pill-member">회원</span>
            <span className="pill-teacher">강사</span>
            <span className="pill-excluded">제외 · 불명</span>
            <span className="source-tag">출처 · 보정본 스팬</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="panel-muted p-4 text-sm leading-relaxed text-accent-strong" role="alert">
          {error}
        </div>
      )}

      {/* 후보 목록 — 선택 시 보정 시작. 키 미설정이면 시작 차단(정직). */}
      <div className="space-y-3">
        <div className="section-head">
          <h2 className="section-head-title">
            검수 후보 <span className="section-head-count">· {objets.length}</span>
          </h2>
          <button className="btn btn-ghost" onClick={() => onNavigate?.('upload')}>
            원본 더 올리기
          </button>
        </div>
        <ul className="space-y-2">
          {objets.map((o) => {
            const isSelected = o.id === selectedId
            return (
              <li
                key={o.id}
                className={`list-row ${isSelected ? 'border-accent' : ''}`}
                aria-current={isSelected || undefined}
              >
                <span className="list-row-title">{o.title}</span>
                <span className="flex shrink-0 items-center gap-2">
                  <span className="meta-chip">{kindLabel(o)}</span>
                  <span className="list-row-meta">{fmtDate(o.createdAt)}</span>
                  <button
                    className="btn btn-ghost px-2 py-1 text-[13px]"
                    disabled={busy || llmReady === false}
                    title={
                      llmReady === false
                        ? 'AI 키 설정 후 보정할 수 있습니다'
                        : busy
                          ? '진행 중입니다'
                          : '보정 시작'
                    }
                    onClick={() => void startCorrect(o)}
                  >
                    {isSelected && stage === 'correcting' ? '보정 중…' : '보정'}
                  </button>
                </span>
              </li>
            )
          })}
        </ul>
      </div>

      {/* 선택된 기록의 보정→초점→발행 패널 */}
      {selected && stage !== 'pick' && (
        <CorrectionPanel
          objet={selected}
          stage={stage}
          corrected={corrected}
          speakerMap={speakerMap}
          terms={terms}
          focuses={focuses}
          includedCount={includedCount}
          publishing={publishing}
          published={published}
          onExtract={() => void runExtract()}
          onSetRole={setFocusRole}
          onToggleInclude={toggleInclude}
          onPublish={() => void publish()}
          onReset={reset}
          onNavigate={onNavigate}
        />
      )}
    </section>
  )
}

/* ── 보정본 + 초점 검수 패널 ─────────────────────────────────── */

function CorrectionPanel({
  objet,
  stage,
  corrected,
  speakerMap,
  terms,
  focuses,
  includedCount,
  publishing,
  published,
  onExtract,
  onSetRole,
  onToggleInclude,
  onPublish,
  onReset,
  onNavigate,
}: {
  objet: Objet
  stage: Stage
  corrected: string
  speakerMap: SpeakerMap[]
  terms: TermFix[]
  focuses: ReviewFocus[]
  includedCount: number
  publishing: boolean
  published: boolean
  onExtract: () => void
  onSetRole: (idx: number, role: Role) => void
  onToggleInclude: (idx: number) => void
  onPublish: () => void
  onReset: () => void
  onNavigate?: (v: View) => void
}) {
  // §5 화자 정체 확정 — 강사가 확인한 정체만 레지스트리(entity)에 영속(자동단정 금지).
  const [confirmed, setConfirmed] = useState<Set<string>>(() => new Set())
  const [confirming, setConfirming] = useState<string | null>(null)
  async function onConfirmSpeaker(s: SpeakerMap) {
    if (!s.identity || confirming) return
    setConfirming(s.raw)
    const ok = await confirmSpeaker({ rawLabel: s.raw, identity: s.identity, role: s.role })
    setConfirming(null)
    if (ok) setConfirmed((prev) => new Set(prev).add(s.raw))
  }

  return (
    <div className="space-y-6">
      <div className="section-head">
        <h2 className="section-head-title">{objet.title} · 보정본</h2>
        <button className="btn btn-ghost px-2 py-1 text-[13px]" onClick={onReset}>
          다른 기록 보정
        </button>
      </div>

      {/* L2 보정본 — 읽기형 본문 + 화자 매핑(제안) + 용어 교정 */}
      <div className="panel space-y-4 p-5">
        <div className="space-y-2">
          <span className="field-label">보정된 전사</span>
          <p className="reading-body whitespace-pre-wrap">{corrected || '—'}</p>
        </div>

        {/* 화자 매핑 — diarization(raw) → 역할/정체(제안). 확신 없으면 불명. */}
        {speakerMap.length > 0 && (
          <div className="space-y-2 border-t border-body-border pt-4">
            <span className="field-label">화자 매핑 (제안)</span>
            <ul className="flex flex-wrap gap-2">
              {speakerMap.map((s, i) => (
                <li key={`${s.raw}-${i}`} className="flex items-center gap-1.5">
                  <span className="meta-chip">{s.raw}</span>
                  <span aria-hidden className="text-body-muted">
                    →
                  </span>
                  <span className={speakerPillClass(s.role)}>
                    {speakerRoleLabel(s.role)}
                    {s.identity ? ` · ${s.identity}` : ''}
                  </span>
                  {s.identity &&
                    (confirmed.has(s.raw) ? (
                      <span className="meta-chip">
                        <span aria-hidden className="status-dot-published" />
                        확정됨
                      </span>
                    ) : (
                      <button
                        className="btn btn-ghost px-2 py-0.5 text-[12px] text-accent-strong"
                        disabled={confirming === s.raw}
                        onClick={() => onConfirmSpeaker(s)}
                      >
                        {confirming === s.raw ? '확정 중…' : '정체 확정'}
                      </button>
                    ))}
                </li>
              ))}
            </ul>
            <p className="text-[12px] leading-relaxed text-body-muted">
              정체 매핑은 AI의 제안입니다. ‘정체 확정’을 누르면 그 화자가 딕셔너리에 등록돼 다음
              보정부터 근거로 쓰입니다(확인된 것만 유효). 확신이 없는 화자는 불명으로 둡니다.
            </p>
          </div>
        )}

        {/* 용어 교정 — 몸소 딕셔너리 기반 from → to */}
        {terms.length > 0 && (
          <div className="space-y-2 border-t border-body-border pt-4">
            <span className="field-label">용어 교정</span>
            <ul className="flex flex-wrap gap-2">
              {terms.map((t, i) => (
                <li key={`${t.from}-${i}`} className="meta-chip">
                  {t.from}
                  <span aria-hidden className="text-body-muted">
                    →
                  </span>
                  <span className="text-body-text">{t.to}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* L3 초점 추출 트리거 — 보정본 확정 후 */}
      {stage === 'corrected' && (
        <button className="btn btn-primary" onClick={onExtract}>
          AI 초점 추출
        </button>
      )}
      {stage === 'extracting' && (
        <div className="flex items-center gap-2 text-sm text-body-muted">
          <span aria-hidden className="accent-dot animate-pulse" />
          보정본에서 대화 초점을 뽑는 중…
        </div>
      )}

      {/* L3 초점 검수 — 칩 + 출처. 회원/강사/제외·불명 확정 후 발행. */}
      {stage === 'reviewing' && (
        <div className="space-y-4">
          {focuses.length === 0 ? (
            <div className="empty-state-tight">
              <p className="empty-state-body">
                근거 있는 초점을 찾지 못했습니다. 보정본에 분명한 출처가 있는 대화가 더 필요할 수 있어요.
              </p>
            </div>
          ) : (
            <>
              <div className="section-head">
                <h3 className="section-head-title">
                  추출된 초점 <span className="section-head-count">· {focuses.length}</span>
                </h3>
                <span className="list-row-meta">발행 포함 {includedCount}</span>
              </div>
              <ul className="space-y-3">
                {focuses.map((f, i) => (
                  <FocusRow
                    key={i}
                    focus={f}
                    onSetRole={(role) => onSetRole(i, role)}
                    onToggleInclude={() => onToggleInclude(i)}
                  />
                ))}
              </ul>

              {published ? (
                <div className="panel-muted flex items-center justify-between gap-3 p-4">
                  <p className="text-sm leading-relaxed text-body-text">
                    <span className="status-dot-published" aria-hidden /> 위키에 발행했습니다.
                  </p>
                  <button className="btn btn-ghost" onClick={() => onNavigate?.('wiki')}>
                    위키에서 보기
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <button
                    className="btn btn-primary"
                    disabled={publishing || includedCount === 0}
                    onClick={onPublish}
                    title={includedCount === 0 ? '발행할 초점을 한 개 이상 포함해 주세요' : '위키로 발행'}
                  >
                    {publishing ? '발행 중…' : `위키로 발행 · ${includedCount}`}
                  </button>
                  <p className="text-[12px] leading-relaxed text-body-muted">
                    포함된 초점만 화자·출처와 함께 위키에 리포트로 발행됩니다.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

/* ── 초점 1조각: 역할 선택 + 포함 토글 + 출처 스팬 ───────────── */

const ROLE_ORDER: Role[] = ['member', 'teacher', 'excluded', 'unknown']

function FocusRow({
  focus,
  onSetRole,
  onToggleInclude,
}: {
  focus: ReviewFocus
  onSetRole: (role: Role) => void
  onToggleInclude: () => void
}) {
  const lockedOut = focus.speakerRole === 'excluded' || focus.speakerRole === 'unknown'
  return (
    <li className={`panel space-y-3 p-4 ${focus.include ? '' : 'opacity-60'}`}>
      <p className="reading-body">{focus.text}</p>

      <div className="flex flex-wrap items-center gap-2">
        {/* 역할 칩 — 검수자가 회원/강사/제외/불명 확정 */}
        <span className="field-label mr-1">화자</span>
        {ROLE_ORDER.map((role) => {
          const active = focus.speakerRole === role
          return (
            <button
              key={role}
              type="button"
              aria-pressed={active}
              className={active ? rolePillClass(role) : 'meta-chip'}
              onClick={() => onSetRole(role)}
            >
              {ROLE_LABEL[role]}
            </button>
          )
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        {/* 무결성: 근거 스팬 항상 동반 */}
        <span className="source-tag">출처 · {focus.sourceSpan}</span>
        <label className="flex items-center gap-2 text-[13px] text-body-muted">
          <input
            type="checkbox"
            checked={focus.include}
            disabled={lockedOut}
            onChange={onToggleInclude}
            className="accent-accent"
          />
          {lockedOut ? '제외·불명은 발행 안 함' : '발행에 포함'}
        </label>
      </div>
    </li>
  )
}