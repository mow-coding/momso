'use client'

import { useMemo, useState, type ChangeEvent } from 'react'
import { addObjet, useDB, FILE_KINDS, isClassKind, type FileKind } from '../lib/store'
import BrandIcon from './BrandIcon'

type View = 'home' | 'upload' | 'review' | 'chat' | 'wiki' | 'settings'

type FileGroup = (typeof FILE_KINDS)[number]['group']

const GROUP_ORDER: FileGroup[] = ['Ⅰ 수업', 'Ⅱ 지식·콘텐츠', 'Ⅲ 운영·CRM']

const kindLabel = (k: FileKind) => FILE_KINDS.find((x) => x.key === k)?.label ?? k

export default function UploadView({ onNavigate }: { onNavigate?: (v: View) => void }) {
  const db = useDB()
  const [kind, setKind] = useState<FileKind>('class_transcript')
  const [title, setTitle] = useState('')
  const [text, setText] = useState('')
  const [fileName, setFileName] = useState<string | null>(null)
  // 직전 올린 파일의 종류 — 무결성 시그널("원본 보존") 한 줄을 정직하게 띄움
  const [lastSaved, setLastSaved] = useState<string | null>(null)

  const canSubmit = Boolean(title.trim() && text.trim())

  // 작성 폼의 종류 select: FILE_KINDS를 group(Ⅰ/Ⅱ/Ⅲ) optgroup으로 묶어 스캔성↑
  const grouped = useMemo(
    () =>
      GROUP_ORDER.map((g) => ({
        group: g,
        kinds: FILE_KINDS.filter((k) => k.group === g),
      })),
    [],
  )

  // 올라온 파일도 같은 group 순서로 묶어 표시(빈 그룹은 렌더 안 함)
  const sections = useMemo(
    () =>
      GROUP_ORDER.map((g) => ({
        group: g,
        items: db.objets.filter((o) => FILE_KINDS.find((k) => k.key === o.kind)?.group === g),
      })).filter((s) => s.items.length > 0),
    [db.objets],
  )

  async function submit() {
    if (!canSubmit) return
    const saved = await addObjet({
      kind,
      title: title.trim(),
      body: text.trim(),
      fileName: fileName ?? undefined,
    })
    if (!saved) return
    setLastSaved(kindLabel(saved.kind))
    setTitle('')
    setText('')
    setFileName(null)
  }

  function onFile(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setFileName(f.name)
    if (!title.trim()) setTitle(f.name.replace(/\.[^.]+$/, ''))
    f.text().then(setText)
  }

  return (
    <div className="max-w-3xl space-y-8">
      {/* ── 작성 카드 ───────────────────────────────────────── */}
      <div className="panel space-y-3 p-5">
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="block text-[11px] font-medium tracking-[0.02em] text-body-muted">제목</span>
            <input
              className="mt-1 w-full rounded-[6px] border border-body-border bg-white px-3 py-2 text-sm text-body-text transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-soft"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 6/20 정렬 에센스"
            />
          </label>
          <label className="block">
            <span className="block text-[11px] font-medium tracking-[0.02em] text-body-muted">종류</span>
            <select
              className="mt-1 w-full rounded-[6px] border border-body-border bg-white px-3 py-2 text-sm text-body-text transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-soft"
              value={kind}
              onChange={(e) => setKind(e.target.value as FileKind)}
            >
              {grouped.map((g) => (
                <optgroup key={g.group} label={g.group}>
                  {g.kinds.map((k) => (
                    <option key={k.key} value={k.key}>
                      {k.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>
        </div>

        <label className="block">
          <span className="block text-[11px] font-medium tracking-[0.02em] text-body-muted">
            전사본 붙여넣기 (또는 파일)
          </span>
          <textarea
            className="mt-1 h-40 w-full rounded-[6px] border border-body-border bg-white px-3 py-2 text-sm leading-relaxed text-body-text transition-colors placeholder:text-body-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-soft"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Tiro / 삼성 전사본 텍스트를 붙여넣으세요"
          />
        </label>

        <div className="flex items-center gap-3">
          <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-body-muted">
            <span className="rounded-[6px] border border-body-border bg-white px-2.5 py-1.5 text-body-text transition-colors hover:bg-sage">
              파일 선택
            </span>
            <span className="min-w-0 max-w-[16rem] truncate">{fileName ?? '텍스트 파일 (.txt .md .json .csv)'}</span>
            <input type="file" accept=".txt,.md,.json,.csv" onChange={onFile} className="hidden" />
          </label>
          <div className="flex-1" />
          <button className="btn btn-primary" disabled={!canSubmit} onClick={submit}>
            올리기
          </button>
        </div>

        {/* 무결성 시그널 — 붙여넣기/파일 동등, 원본 보존 약속을 정직히 */}
        <p className="text-[12px] leading-relaxed text-body-muted">
          {lastSaved ? (
            <>
              <span className="font-medium text-body-text">{lastSaved}</span> 올렸어요. 원본 텍스트는 그대로
              보존됩니다.
            </>
          ) : (
            <>
              붙여넣기와 파일은 동등하게 저장됩니다. 음성·PDF 원본 보관(NCP)은 준비 중이라, 지금은 텍스트가
              보존됩니다.
            </>
          )}
        </p>
      </div>

      {/* ── 데이터 공유 상태(브랜드 CI: surya/hatha/chandra) — 원본은 모두 미정(surya) ── */}
      <section className="panel-muted flex flex-wrap items-center gap-x-5 gap-y-2 p-4">
        <span className="text-[11px] font-medium tracking-[0.02em] text-body-muted">데이터 공유 상태</span>
        <span className="flex items-center gap-1.5 text-[13px] text-body-text">
          <BrandIcon name="surya" size={20} /> 미정 <span className="text-body-muted">· 원본 기본</span>
        </span>
        <span className="flex items-center gap-1.5 text-[13px] text-body-muted">
          <BrandIcon name="hatha" size={20} /> 공유 가능
        </span>
        <span className="flex items-center gap-1.5 text-[13px] text-body-muted">
          <BrandIcon name="chandra" size={20} /> 비공유
        </span>
        <p className="w-full text-[11px] leading-relaxed text-body-muted">
          올린 원본은 모두 <span className="text-body-text">미정(surya)</span> 상태로 보존돼요. 공유 여부를
          결정하는 기능은 준비 중입니다.
        </p>
      </section>

      {/* ── 올라온 파일 ─────────────────────────────────────── */}
      <section>
        {/* 섹션 헤더 — 14px/600 제목 + 카운트 인라인 (키커 금지) */}
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-sm font-semibold text-body-text">
            올라온 파일
            {db.objets.length > 0 && (
              <span className="ml-2 font-normal text-body-muted">· {db.objets.length}</span>
            )}
          </h2>
        </div>

        <div className="mt-3">
          {!db.loaded ? (
            <div className="rounded-[12px] border border-body-border bg-body-surface p-6 text-sm text-body-muted">
              불러오는 중…
            </div>
          ) : db.objets.length === 0 ? (
            // 빈 상태 (a) — 기능 구현됨 · 데이터 없음
            <div className="rounded-[12px] border border-body-border bg-body-surface p-6">
              <span className="block h-[3px] w-10 rounded-full bg-accent" />
              <p className="mt-3 text-lg font-semibold leading-snug text-body-text">아직 올린 파일이 없어요.</p>
              <p className="mt-1 text-sm leading-relaxed text-body-muted">
                수업 산출물부터 요가원 지식·CRM까지, 무엇이든 종류만 태깅해 위의 폼으로 올리세요.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {sections.map((s) => (
                <div key={s.group}>
                  <div className="mb-2 text-[11px] font-medium tracking-[0.02em] text-body-muted">
                    {s.group} · {s.items.length}
                  </div>
                  <ul className="space-y-2">
                    {s.items.map((o) => (
                      <li
                        key={o.id}
                        className="flex items-center justify-between gap-3 rounded-[12px] border border-body-border bg-white p-3 text-sm"
                      >
                        <span className="min-w-0 flex-1 truncate font-medium text-body-text">{o.title}</span>
                        <div className="flex shrink-0 items-center gap-2">
                          {isClassKind(o.kind) && onNavigate && (
                            <button
                              className="btn btn-ghost px-2 py-1 text-[13px] text-accent-strong"
                              onClick={() => onNavigate('review')}
                            >
                              검수로
                            </button>
                          )}
                          <span className="inline-flex items-center rounded-full border border-body-border px-2.5 py-1 text-[11px] text-body-muted">
                            {kindLabel(o.kind)}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}