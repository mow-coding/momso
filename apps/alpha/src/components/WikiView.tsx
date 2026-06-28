'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  useDB,
  listReportEdges,
  listAllEdges,
  linkReports,
  unlinkEdge,
  logKpi,
  type Zet,
  type EdgeKind,
  type ReportEdge,
} from '../lib/store'

type View = 'home' | 'upload' | 'review' | 'chat' | 'wiki' | 'settings'

type SortKey = 'recent' | 'title'

const SOURCE_LABEL: Record<Zet['source'], string> = {
  class: '수업발',
  chat: '대화발',
}

// 관계 종류 라벨 1곳 관리(중복 금지) — 전부 사용자노출 "리포트" 톤.
const EDGE_KINDS: { key: EdgeKind; label: string }[] = [
  { key: 'supersedes', label: '상위호환' },
  { key: 'related', label: '관련' },
  { key: 'contraindication', label: '금기 동반' },
  { key: 'longitudinal', label: '종단' },
]
const KIND_LABEL: Record<EdgeKind, string> = EDGE_KINDS.reduce(
  (acc, k) => ({ ...acc, [k.key]: k.label }),
  {} as Record<EdgeKind, string>,
)

function fmtDate(ts?: number) {
  if (!ts) return ''
  return new Date(ts).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
}

export default function WikiView({ onNavigate }: { onNavigate?: (v: View) => void }) {
  const db = useDB()
  const [sort, setSort] = useState<SortKey>('recent')
  const [openId, setOpenId] = useState<string | null>(null)

  // 무결성 게이트: 위키 본체 = published zet 만(검수된 것만 노출)
  const published = useMemo(() => db.zets.filter((z) => z.status === 'published'), [db.zets])

  const sorted = useMemo(() => {
    const arr = [...published]
    if (sort === 'title') {
      arr.sort((a, b) => a.title.localeCompare(b.title, 'ko-KR'))
    } else {
      arr.sort((a, b) => (b.publishedAt ?? b.createdAt) - (a.publishedAt ?? a.createdAt))
    }
    return arr
  }, [published, sort])

  const open = openId ? published.find((z) => z.id === openId) ?? null : null

  // 北極星(앵커링): 검수·발행 리포트를 다시 열어볼 때마다 revisit 이벤트 기록(재방문율 계측).
  useEffect(() => {
    if (openId) void logKpi('revisit', { zet_id: openId })
  }, [openId])

  // ── 상세 보기 (max-w-prose 읽기형) ──────────────────────────
  if (open) {
    return (
      <div className="max-w-prose space-y-8">
        <button
          className="btn btn-ghost -ml-3 text-sm text-body-muted"
          onClick={() => setOpenId(null)}
        >
          ← 리포트 목록
        </button>

        <article className="space-y-5">
          <h2 className="text-lg font-semibold leading-snug text-body-text">{open.title}</h2>

          <div className="flex flex-wrap items-center gap-2">
            <span className="meta-chip">{SOURCE_LABEL[open.source]}</span>
            <span className="mono-label">{fmtDate(open.publishedAt ?? open.createdAt)} 발행</span>
            <span className="source-tag">검수 발행</span>
          </div>

          <div className="reading-body whitespace-pre-wrap">{open.body}</div>
        </article>

        {/* 관계 그래프: 이 리포트에 사람이 확정한 연결(가짜 0·실 엣지만) */}
        <RelatedReports open={open} published={published} onOpen={setOpenId} />

        {/* 무결성: 출처·귀속 블록 (제품 #1 불변식의 UI 표현) */}
        <section className="panel-muted bg-sage space-y-2 p-5">
          <div className="section-head">
            <span className="section-head-title">출처 · 귀속</span>
          </div>
          <p className="text-sm leading-relaxed text-body-muted">
            이 리포트는 <span className="font-medium text-body-text">{SOURCE_LABEL[open.source]}</span>로
            만들어져 검수를 거쳐 발행됐습니다. AI는 보정본 원본까지 참고하지만, 위키에는 검수된 내용만
            남습니다.
          </p>
          <p className="text-[11px] leading-relaxed text-body-muted">
            리포트 사이의 연결은 사람이 직접 확정합니다(자동 생성 없음).
          </p>
        </section>
      </div>
    )
  }

  // ── 발행 0건 — 데이터 없음(기능 구현됨) + 동선 ───────────────
  if (published.length === 0) {
    return (
      <div className="max-w-5xl space-y-8">
        <section className="empty-state space-y-4">
          <span className="accent-rule" />
          <div className="empty-state-title">아직 발행된 리포트가 없습니다</div>
          <p className="empty-state-body">
            위키는 수업과 대화에서 자랍니다. 대화에서 바로 발행하거나, 올린 수업 기록을 검수해 첫 리포트를
            만들어 보세요.
          </p>
          <div className="flex flex-wrap gap-4 text-sm">
            <button className="empty-state-link" onClick={() => onNavigate?.('chat')}>
              대화에서 발행하기
            </button>
            <button className="empty-state-link" onClick={() => onNavigate?.('review')}>
              검수에서 발행하기
            </button>
          </div>
        </section>

        {/* 관계 그래프 — 발행 0이면 연결 대상 없음(정직한 빈 상태) */}
        <RelationView published={published} onOpen={setOpenId} />
      </div>
    )
  }

  // ── 목록 (max-w-5xl) ────────────────────────────────────────
  return (
    <div className="max-w-5xl space-y-8">
      <section className="space-y-3">
        <div className="section-head">
          <h2 className="section-head-title">
            발행된 리포트 <span className="section-head-count">· {published.length}</span>
          </h2>
          <div className="flex items-center gap-1">
            <button
              className={`seg-tab ${sort === 'recent' ? 'seg-tab-active' : ''}`}
              onClick={() => setSort('recent')}
            >
              최신
            </button>
            <button
              className={`seg-tab ${sort === 'title' ? 'seg-tab-active' : ''}`}
              onClick={() => setSort('title')}
            >
              제목
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {sorted.map((z) => (
            <button
              key={z.id}
              type="button"
              onClick={() => setOpenId(z.id)}
              className="panel list-row-link block p-5 text-left"
            >
              <div className="flex items-center gap-2">
                <span className="status-dot-published" aria-hidden />
                <span className="truncate text-lg font-semibold text-body-text">{z.title}</span>
              </div>
              <p className="reading-body mt-2 line-clamp-2">{z.body}</p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="meta-chip">{SOURCE_LABEL[z.source]}</span>
                <span className="mono-label">{fmtDate(z.publishedAt ?? z.createdAt)}</span>
                <span className="source-tag">검수 발행</span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* 관계 그래프 — 실제 엣지만 비춤(가짜 0) */}
      <RelationView published={published} onOpen={setOpenId} />
    </div>
  )
}

// ── 상세: "관련 리포트" 섹션 (kind별 그룹, 연결 해제) ──────────
function RelatedReports({
  open,
  published,
  onOpen,
}: {
  open: Zet
  published: Zet[]
  onOpen: (id: string) => void
}) {
  const [edges, setEdges] = useState<ReportEdge[]>([])
  const [loaded, setLoaded] = useState(false)
  const [linking, setLinking] = useState(false)

  const titleOf = useCallback(
    (id: string) => published.find((z) => z.id === id)?.title ?? '(검수 전·찾을 수 없음)',
    [published],
  )

  const reload = useCallback(async () => {
    const rows = await listReportEdges(open.id)
    setEdges(rows)
    setLoaded(true)
  }, [open.id])

  useEffect(() => {
    setLoaded(false)
    void reload()
  }, [reload])

  // 이미 연결된 상대 리포트 id(연결 폼 후보에서 제외).
  const linkedIds = useMemo(() => {
    const s = new Set<string>()
    for (const e of edges) s.add(e.fromZet === open.id ? e.toZet : e.fromZet)
    return s
  }, [edges, open.id])

  const onUnlink = useCallback(
    async (id: string) => {
      await unlinkEdge(id)
      await reload()
    },
    [reload],
  )

  // kind별 그룹 — 빈 그룹은 미표시(가짜 0).
  const groups = useMemo(
    () =>
      EDGE_KINDS.map((k) => ({
        kind: k.key,
        label: k.label,
        rows: edges.filter((e) => e.kind === k.key),
      })).filter((g) => g.rows.length > 0),
    [edges],
  )

  return (
    <section className="space-y-4">
      <div className="section-head">
        <span className="section-head-title">
          관련 리포트
          {loaded && edges.length > 0 ? <span className="section-head-count"> · {edges.length}</span> : null}
        </span>
        <button className="seg-tab" onClick={() => setLinking((v) => !v)}>
          {linking ? '닫기' : '리포트 연결'}
        </button>
      </div>

      {linking ? (
        <LinkReportForm
          open={open}
          published={published}
          excludeIds={linkedIds}
          onLinked={async () => {
            await reload()
            setLinking(false)
          }}
        />
      ) : null}

      {loaded && edges.length === 0 ? (
        <p className="text-sm text-body-muted">
          아직 연결된 리포트가 없습니다. “리포트 연결”로 상위호환·관련·금기 동반·종단 관계를 직접 맺을 수 있습니다.
        </p>
      ) : null}

      {groups.map((g) => (
        <div key={g.kind} className="space-y-2">
          <div className="section-head">
            <span className="section-head-title text-sm">{g.label}</span>
          </div>
          <div className="space-y-2">
            {g.rows.map((e) => {
              const otherId = e.fromZet === open.id ? e.toZet : e.fromZet
              const direction =
                e.kind === 'supersedes'
                  ? e.fromZet === open.id
                    ? '이 리포트가 대체함 →'
                    : '← 이 리포트를 대체한 최신본'
                  : null
              return (
                <div key={e.id} className="panel-muted flex items-start justify-between gap-3 p-4">
                  <button
                    type="button"
                    onClick={() => onOpen(otherId)}
                    className="list-row-link min-w-0 flex-1 text-left"
                  >
                    {direction ? <span className="mono-label">{direction}</span> : null}
                    <div className="truncate font-medium text-body-text">{titleOf(otherId)}</div>
                    {e.note ? <p className="reading-body mt-1 line-clamp-2 text-sm">{e.note}</p> : null}
                  </button>
                  <button className="btn btn-ghost text-xs text-body-muted" onClick={() => onUnlink(e.id)}>
                    연결 해제
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </section>
  )
}

// ── "리포트 연결" 폼 (대상 select + kind seg-tab + note) ───────
function LinkReportForm({
  open,
  published,
  excludeIds,
  onLinked,
}: {
  open: Zet
  published: Zet[]
  excludeIds: Set<string>
  onLinked: () => void | Promise<void>
}) {
  const candidates = useMemo(
    () => published.filter((z) => z.id !== open.id && !excludeIds.has(z.id)),
    [published, open.id, excludeIds],
  )
  const [targetId, setTargetId] = useState('')
  const [kind, setKind] = useState<EdgeKind>('related')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const onSubmit = useCallback(async () => {
    if (!targetId || busy) return
    setBusy(true)
    setErr('')
    const res = await linkReports(open.id, targetId, kind, note)
    setBusy(false)
    if (!res) {
      setErr('연결에 실패했습니다(이미 같은 관계가 있거나 잘못된 대상).')
      return
    }
    setTargetId('')
    setNote('')
    setKind('related')
    await onLinked()
  }, [targetId, busy, open.id, kind, note, onLinked])

  if (candidates.length === 0) {
    return (
      <div className="panel-muted p-4">
        <p className="text-sm text-body-muted">연결할 다른 발행 리포트가 없습니다.</p>
      </div>
    )
  }

  return (
    <div className="panel-muted space-y-4 p-5">
      <div className="space-y-2">
        <span className="mono-label">연결할 리포트</span>
        <select
          className="seg-tab w-full"
          value={targetId}
          onChange={(e) => setTargetId(e.target.value)}
        >
          <option value="">— 리포트 선택 —</option>
          {candidates.map((z) => (
            <option key={z.id} value={z.id}>
              {z.title}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <span className="mono-label">관계 종류</span>
        <div className="flex flex-wrap items-center gap-1">
          {EDGE_KINDS.map((k) => (
            <button
              key={k.key}
              type="button"
              className={`seg-tab ${kind === k.key ? 'seg-tab-active' : ''}`}
              onClick={() => setKind(k.key)}
            >
              {k.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <span className="mono-label">메모(선택)</span>
        <input
          className="seg-tab w-full"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="이 연결의 근거·맥락"
        />
      </div>

      {err ? <p className="text-sm text-body-muted">{err}</p> : null}

      <button className="seg-tab seg-tab-active" disabled={!targetId || busy} onClick={onSubmit}>
        {busy ? '연결 중…' : `${KIND_LABEL[kind]}(으)로 연결`}
      </button>
    </div>
  )
}

// ── 관계 그래프 뷰 (실제 엣지만; 연결 리스트, 가짜 0) ──────────
function RelationView({ published, onOpen }: { published: Zet[]; onOpen: (id: string) => void }) {
  const [edges, setEdges] = useState<ReportEdge[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let alive = true
    setLoaded(false)
    void listAllEdges().then((rows) => {
      if (alive) {
        setEdges(rows)
        setLoaded(true)
      }
    })
    return () => {
      alive = false
    }
  }, [])

  const titleOf = useCallback(
    (id: string) => published.find((z) => z.id === id)?.title ?? '(검수 전·찾을 수 없음)',
    [published],
  )

  // 빈 상태(발행 0이거나 엣지 0) — 정직한 빈 상태.
  if (loaded && edges.length === 0) {
    return (
      <section className="empty-state space-y-3">
        <span className="accent-rule" />
        <div className="empty-state-title">리포트 사이의 관계 그래프</div>
        <p className="empty-state-body">
          리포트를 연결하면 관계 그래프가 자랍니다. 리포트 상세에서 “리포트 연결”로 상위호환·관련·금기
          동반·종단 관계를 직접 맺어 보세요.
        </p>
        <p className="text-[11px] text-body-muted">
          발행 리포트 {published.length} · 연결 {edges.length}
        </p>
      </section>
    )
  }

  return (
    <section className="space-y-3">
      <div className="section-head">
        <h2 className="section-head-title">
          관계 그래프 <span className="section-head-count">· 연결 {edges.length}</span>
        </h2>
        <span className="mono-label">발행 리포트 {published.length}</span>
      </div>

      <div className="space-y-2">
        {edges.map((e) => (
          <div key={e.id} className="panel-muted flex flex-wrap items-center gap-2 p-4">
            <button
              type="button"
              className="list-row-link truncate font-medium text-body-text"
              onClick={() => onOpen(e.fromZet)}
            >
              {titleOf(e.fromZet)}
            </button>
            <span className="source-tag">{KIND_LABEL[e.kind]} →</span>
            <button
              type="button"
              className="list-row-link truncate font-medium text-body-text"
              onClick={() => onOpen(e.toZet)}
            >
              {titleOf(e.toZet)}
            </button>
            {e.note ? <span className="mono-label w-full truncate">{e.note}</span> : null}
          </div>
        ))}
      </div>
    </section>
  )
}