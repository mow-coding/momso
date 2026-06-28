'use client'

import { useEffect, useState } from 'react'
import { useDB, getLlmConfigured, listBaseDictionary, getAnchoringStats } from '../lib/store'

type View = 'home' | 'upload' | 'review' | 'chat' | 'wiki' | 'settings'

/** 업로드 시각 — 한국어 상대 표기(외부 라이브러리 없이). 오늘/어제는 시:분, 그 외 M/D. */
function formatWhen(ts: number): string {
  const d = new Date(ts)
  const now = new Date()
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
  const dayDiff = Math.round((startOf(now) - startOf(d)) / 86_400_000)
  const hm = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
  if (dayDiff === 0) return `오늘 ${hm}`
  if (dayDiff === 1) return `어제 ${hm}`
  if (d.getFullYear() === now.getFullYear()) return `${d.getMonth() + 1}/${d.getDate()}`
  return d.toLocaleDateString('ko-KR')
}

type Activity = { key: string; title: string; at: number; tag: string; published?: boolean; draft?: boolean }

export default function HomeView({ onNavigate }: { onNavigate?: (v: View) => void }) {
  const db = useDB()
  const [llmReady, setLlmReady] = useState<boolean | null>(null)
  const [dictCount, setDictCount] = useState<number | null>(null)
  const [anchor, setAnchor] = useState<{ revisits: number; anchoredReports: number } | null>(null)

  useEffect(() => {
    getLlmConfigured()
      .then(setLlmReady)
      .catch(() => setLlmReady(false))
    listBaseDictionary()
      .then((d) => setDictCount(d.length))
      .catch(() => setDictCount(null))
    getAnchoringStats()
      .then(setAnchor)
      .catch(() => setAnchor(null))
  }, [])

  const published = db.zets.filter((z) => z.status === 'published').length
  const drafts = db.zets.filter((z) => z.status === 'draft').length
  const hasData = db.objets.length > 0 || db.zets.length > 0

  const activity: Activity[] = [
    ...db.objets.map((o) => ({ key: 'o' + o.id, title: o.title, at: o.createdAt, tag: '원본' })),
    ...db.zets.map((z) => ({
      key: 'z' + z.id,
      title: z.title,
      at: z.createdAt,
      tag: z.status === 'published' ? '발행' : '초안',
      published: z.status === 'published',
      draft: z.status === 'draft',
    })),
  ]
    .sort((a, b) => b.at - a.at)
    .slice(0, 6)

  // 시작하기 — 새 강사 오리엔테이션(실상태 기반)
  const steps = [
    {
      done: llmReady === true,
      title: 'AI 연결하기',
      desc: '내 OpenAI 키를 넣으면 대화·전사 보정·초점 추출이 작동해요.',
      cta: '설정에서 연결',
      onClick: () => onNavigate?.('settings'),
    },
    {
      done: hasData,
      title: '첫 기록 올리거나 대화 시작',
      desc: '수업 전사본을 올리거나, 위키가 비어 있어도 대화로 바로 시작할 수 있어요.',
      cta: '기록 올리기',
      onClick: () => onNavigate?.('upload'),
    },
    {
      done: published > 0,
      title: '첫 위키 발행',
      desc: '검수에서 보정·초점을 확인하거나 대화에서 바로 발행하면 위키가 자라요.',
      cta: '대화로 가기',
      onClick: () => onNavigate?.('chat'),
    },
  ]
  const doneCount = steps.filter((s) => s.done).length

  const stats = [
    { value: db.objets.length, label: '올린 기록', hint: '원본 파일' },
    { value: drafts, label: '검수 대기', hint: '초안' },
    { value: published, label: '발행한 리포트', hint: '위키에 발행됨' },
  ]

  return (
    <div className="max-w-3xl space-y-8">
      {/* ① 시작하기 — 새 강사 오리엔테이션(완료 시 진행도 표시) */}
      <section className="panel p-5">
        <div className="section-head">
          <div className="flex items-baseline gap-2">
            <h2 className="section-head-title">시작하기</h2>
            <span className="section-head-count">{doneCount}/3</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="btn btn-primary" onClick={() => onNavigate?.('chat')}>
              몸이와 대화하기
            </button>
            <button
              className="btn border border-body-border bg-white"
              onClick={() => onNavigate?.('upload')}
            >
              기록 올리기
            </button>
          </div>
        </div>

        <ol className="mt-4 space-y-2">
          {steps.map((s, i) => (
            <li key={i} className="list-row">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <span
                  aria-hidden
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold ${
                    s.done ? 'bg-accent text-white' : 'border border-body-border text-body-muted'
                  }`}
                >
                  {s.done ? '✓' : i + 1}
                </span>
                <div className="min-w-0">
                  <div
                    className={`text-sm font-medium ${s.done ? 'text-body-muted' : 'text-body-text'}`}
                  >
                    {s.title}
                  </div>
                  <div className="mt-0.5 text-[11px] leading-relaxed text-body-muted">{s.desc}</div>
                </div>
              </div>
              {s.done ? (
                <span className="meta-chip shrink-0">
                  <span aria-hidden className="status-dot-published" />
                  완료
                </span>
              ) : (
                <button
                  className="btn border border-body-border bg-white shrink-0"
                  onClick={s.onClick}
                >
                  {s.cta}
                </button>
              )}
            </li>
          ))}
        </ol>
      </section>

      {/* ② 현황 3스탯 — 실데이터, 숫자에 코랄 칠 금지 */}
      <section className="grid grid-cols-3 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="stat-card">
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
            <div className="stat-hint">{s.hint}</div>
          </div>
        ))}
      </section>

      {/* 北極星 — 검수 기록 재방문(앵커링). 발행 리포트가 있을 때만 노출. */}
      {published > 0 && anchor && (
        <section className="panel p-4">
          <div className="flex items-baseline justify-between gap-3">
            <div className="min-w-0">
              <div className="text-sm font-semibold text-body-text">앵커링 · 검수 기록 재방문</div>
              <p className="mt-0.5 text-[12px] leading-relaxed text-body-muted">
                발행한 리포트로 다시 돌아오는 정도 — 몸소의 북극성 지표예요.
              </p>
            </div>
            <div className="shrink-0 text-right">
              <div className="stat-value">{anchor.revisits}</div>
              <div className="stat-hint">리포트 {anchor.anchoredReports}개 재방문</div>
            </div>
          </div>
        </section>
      )}

      {/* ③ 최근 활동 — 업로드 + 발행/초안 통합, 최신순 / 정직한 빈 상태 */}
      <section>
        <div className="section-head">
          <div className="flex items-baseline gap-2">
            <h2 className="section-head-title">최근 활동</h2>
            {activity.length > 0 && <span className="section-head-count">{activity.length}</span>}
          </div>
          {db.objets.length > 0 && (
            <button className="btn btn-ghost" onClick={() => onNavigate?.('upload')}>
              업로드
            </button>
          )}
        </div>

        {activity.length === 0 ? (
          <div className="empty-state-tight mt-3">
            <p className="empty-state-body">
              아직 활동이 없어요.{' '}
              <button className="empty-state-link" onClick={() => onNavigate?.('upload')}>
                첫 기록 올리기
              </button>
              {dictCount ? ` · 기본 요가 용어 ${dictCount}개는 이미 준비돼 있어요.` : ''}
            </p>
          </div>
        ) : (
          <ul className="mt-3 space-y-2">
            {activity.map((a) => (
              <li key={a.key} className="list-row">
                <span className="list-row-title">{a.title}</span>
                <span className="flex shrink-0 items-center gap-2">
                  <span className="meta-chip">
                    {a.published && <span aria-hidden className="status-dot-published" />}
                    {a.draft && <span aria-hidden className="status-dot-draft" />}
                    {a.tag}
                  </span>
                  <span className="list-row-meta">{formatWhen(a.at)}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
