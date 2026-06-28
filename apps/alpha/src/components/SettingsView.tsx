'use client'

import { useEffect, useState } from 'react'
import { useWorkspaces, setActiveWorkspace, createWorkspace } from '../lib/workspace'
import { useAuth, signOut } from '../lib/auth'
import {
  saveLlmKey,
  getLlmConfigured,
  listBaseDictionary,
  getCustomerDbStatus,
  connectCustomerDb,
  disconnectCustomerDb,
  type BaseDictTerm,
} from '../lib/store'

/**
 * 설정 — 실구현(워크스페이스·계정·연결 상태·BYOK) + 정직한 준비 상태(딕셔너리).
 * 셸 헤더가 제목('설정')의 유일 출처 → 자기 제목 없음.
 * 액센트 예산: 차분한 화면이라 코랄 솔리드/CTA 없음. 상태 의미색(세이지=연결/코랄소프트=미설정)만.
 *
 * BYOK 보안: OpenAI 키는 입력 즉시 서버로만 전송(POST /api/byok, AES-256-GCM 암호화 저장).
 * 키는 컴포넌트 로컬 state로만 잠깐 보관 → 저장 성공 후 즉시 비움(메모리 노출 최소화).
 * 절대 localStorage/sessionStorage/NEXT_PUBLIC 미사용. 상태 확인(GET)은 configured 불리언만 받음.
 */
export default function SettingsView() {
  const { workspaces, active, loaded } = useWorkspaces()
  const { user, isSupabaseConfigured } = useAuth()

  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)

  // BYOK 상태
  const [apiKey, setApiKey] = useState('')
  const [llmConfigured, setLlmConfigured] = useState<boolean | null>(null) // null=확인 중
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(false)

  // 기본 제공 딕셔너리(dictionary_term scope=base) — 실데이터
  const [dict, setDict] = useState<BaseDictTerm[]>([])

  // 내 Supabase 연결(BYO 데이터 분리) — 입력은 서버로만 전송, 저장 성공 즉시 비움
  const [dbUrl, setDbUrl] = useState('')
  const [dbAnonKey, setDbAnonKey] = useState('')
  const [dbServiceKey, setDbServiceKey] = useState('')
  // null=확인 중
  const [dbStatus, setDbStatus] = useState<
    { connected: boolean; provisioned: boolean; urlMasked: string | null } | null
  >(null)
  const [dbSaving, setDbSaving] = useState(false)
  const [dbDisconnecting, setDbDisconnecting] = useState(false)
  const [dbError, setDbError] = useState(false)

  const canCreate = Boolean(newName.trim()) && !creating
  const canSaveKey = apiKey.trim().length > 0 && !saving && isSupabaseConfigured
  const canConnectDb =
    dbUrl.trim().length > 0 &&
    dbAnonKey.trim().length > 0 &&
    dbServiceKey.trim().length > 0 &&
    !dbSaving &&
    isSupabaseConfigured

  // 설정 여부 조회(키 비반환 — configured 불리언만)
  useEffect(() => {
    let alive = true
    if (!isSupabaseConfigured) {
      setLlmConfigured(false)
      return
    }
    getLlmConfigured()
      .then((c) => {
        if (alive) setLlmConfigured(c)
      })
      .catch((e) => {
        console.error('getLlmConfigured', e)
        if (alive) setLlmConfigured(false)
      })
    return () => {
      alive = false
    }
  }, [isSupabaseConfigured])

  // 기본 딕셔너리 로드(인증 사용자 base 읽기)
  useEffect(() => {
    let alive = true
    listBaseDictionary()
      .then((d) => {
        if (alive) setDict(d)
      })
      .catch((e) => console.error('listBaseDictionary', e))
    return () => {
      alive = false
    }
  }, [])

  // 내 Supabase 연결 상태(키·암호문 비반환 — connected/provisioned/마스킹 URL만)
  useEffect(() => {
    let alive = true
    if (!isSupabaseConfigured) {
      setDbStatus({ connected: false, provisioned: false, urlMasked: null })
      return
    }
    getCustomerDbStatus()
      .then((s) => {
        if (alive) setDbStatus(s)
      })
      .catch((e) => {
        console.error('getCustomerDbStatus', e)
        if (alive) setDbStatus({ connected: false, provisioned: false, urlMasked: null })
      })
    return () => {
      alive = false
    }
  }, [isSupabaseConfigured])

  async function onCreate() {
    const name = newName.trim()
    if (!name || creating) return
    setCreating(true)
    await createWorkspace(name)
    setNewName('')
    setCreating(false)
  }

  async function onSaveKey() {
    const key = apiKey.trim()
    if (!key || saving) return
    setSaving(true)
    setSaveError(false)
    try {
      const ok = await saveLlmKey(key, 'openai')
      if (ok) {
        setLlmConfigured(true)
        setApiKey('') // 저장 성공 즉시 메모리에서 비움
      } else {
        setSaveError(true)
      }
    } catch (e) {
      console.error('saveLlmKey', e)
      setSaveError(true)
    } finally {
      setSaving(false)
    }
  }

  async function onConnectDb() {
    const url = dbUrl.trim()
    const anonKey = dbAnonKey.trim()
    const serviceKey = dbServiceKey.trim()
    if (!url || !anonKey || !serviceKey || dbSaving) return
    setDbSaving(true)
    setDbError(false)
    try {
      const r = await connectCustomerDb({ url, anonKey, serviceKey })
      if (r.ok) {
        // 입력값(특히 service 키)은 저장 성공 즉시 메모리에서 비움.
        setDbUrl('')
        setDbAnonKey('')
        setDbServiceKey('')
        // 마스킹 URL은 서버 GET이 정본 → 저장 후 상태 재조회.
        setDbStatus(await getCustomerDbStatus())
      } else {
        setDbError(true)
      }
    } catch (e) {
      console.error('connectCustomerDb', e)
      setDbError(true)
    } finally {
      setDbSaving(false)
    }
  }

  async function onDisconnectDb() {
    if (dbDisconnecting) return
    setDbDisconnecting(true)
    setDbError(false)
    try {
      const ok = await disconnectCustomerDb()
      if (ok) {
        setDbStatus({ connected: false, provisioned: false, urlMasked: null })
      } else {
        setDbError(true)
      }
    } catch (e) {
      console.error('disconnectCustomerDb', e)
      setDbError(true)
    } finally {
      setDbDisconnecting(false)
    }
  }

  const initial = (user?.name ?? user?.email ?? '강').trim().charAt(0).toUpperCase()

  return (
    <div className="max-w-2xl space-y-8">
      {/* ① 워크스페이스 — 실값(useWorkspaces) ───────────────────── */}
      <section className="panel p-5">
        <div className="section-head">
          <div className="flex items-baseline gap-2">
            <h2 className="text-sm font-semibold text-body-text">워크스페이스</h2>
            <span className="text-sm font-normal text-body-muted">{workspaces.length}</span>
          </div>
        </div>
        <p className="mt-1 text-sm leading-relaxed text-body-muted">
          요가원 단위 경계예요. 올린 파일·발행 기록은 활성 워크스페이스 안에서만 보입니다.
        </p>

        <div className="mt-3 space-y-2">
          {!loaded ? (
            <div className="flex items-center gap-2 px-1 text-sm text-body-muted">
              <span aria-hidden className="accent-dot animate-pulse" />
              불러오는 중…
            </div>
          ) : (
            workspaces.map((w) => {
              const isActive = w.id === active?.id
              return (
                <button
                  key={w.id}
                  onClick={() => setActiveWorkspace(w.id)}
                  aria-pressed={isActive}
                  className="list-row list-row-link w-full text-left"
                >
                  <span className="list-row-title">{w.name}</span>
                  {isActive ? (
                    <span className="meta-chip shrink-0">
                      <span aria-hidden className="status-dot-published" />
                      활성
                    </span>
                  ) : (
                    <span className="list-row-meta">전환</span>
                  )}
                </button>
              )
            })
          )}
        </div>

        {/* 추가 — 차분: btn-primary 아님(중립 보더 버튼) */}
        <div className="mt-3 flex items-end gap-2">
          <label className="block flex-1">
            <span className="field-label">새 워크스페이스</span>
            <input
              className="field-input"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void onCreate()
              }}
              placeholder="예: 빅블루 요가"
            />
          </label>
          <button
            className="btn border border-body-border bg-white"
            disabled={!canCreate}
            onClick={onCreate}
          >
            추가
          </button>
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-body-muted">
          알파는 한 분이 여러 요가원을 운영하는 경우까지예요. 한 요가원을 여러 강사가 함께 쓰는 건
          베타에서 열립니다.
        </p>
      </section>

      {/* ② 연결 상태 — 실값(isSupabaseConfigured·llmConfigured) ──── */}
      <section className="panel p-5">
        <div className="section-head">
          <h2 className="text-sm font-semibold text-body-text">연결 상태</h2>
        </div>
        <p className="mt-1 text-sm leading-relaxed text-body-muted">
          데이터가 어디에 저장되고, 무엇이 아직 연결 전인지 있는 그대로 보여줍니다.
        </p>

        <ul className="mt-3 space-y-2">
          {/* Supabase — 실제 설정 여부 */}
          <li className="list-row">
            <div className="min-w-0 flex-1">
              <div className="font-medium text-body-text">데이터베이스 · Supabase</div>
              <div className="mt-0.5 text-[11px] leading-relaxed text-body-muted">
                워크스페이스 · 업로드 · 발행 기록이 여기에 저장됩니다.
              </div>
            </div>
            {isSupabaseConfigured ? (
              <span className="meta-chip shrink-0">
                <span aria-hidden className="status-dot-published" />
                연결됨
              </span>
            ) : (
              <span className="shrink-0 rounded-full bg-accent-soft px-2.5 py-1 text-[11px] font-medium text-accent-strong">
                미설정
              </span>
            )}
          </li>

          {/* AI 모델 — BYOK 키 설정 여부에 따른 실상태 */}
          <li className="list-row">
            <div className="min-w-0 flex-1">
              <div className="font-medium text-body-text">AI 모델 · 생성 프로바이더</div>
              <div className="mt-0.5 text-[11px] leading-relaxed text-body-muted">
                대화·전사 보정·초점 추출에 내 OpenAI 키를 씁니다. 아래에서 연결하세요.
              </div>
            </div>
            {llmConfigured === null ? (
              <span className="meta-chip shrink-0">
                <span aria-hidden className="accent-dot animate-pulse" />
                확인 중
              </span>
            ) : llmConfigured ? (
              <span className="meta-chip shrink-0">
                <span aria-hidden className="status-dot-published" />
                설정됨
              </span>
            ) : (
              <span className="shrink-0 rounded-full bg-accent-soft px-2.5 py-1 text-[11px] font-medium text-accent-strong">
                미설정
              </span>
            )}
          </li>
        </ul>

        {/* BYOK — OpenAI 키 입력(②의 하위 블록, 실동작) ─────────── */}
        <div className="mt-3 rounded-[6px] bg-sage px-3 py-3">
          <div className="text-[11px] leading-relaxed text-body-muted">
            <span className="font-medium text-body-text">내 키로 연결(BYOK)</span> — 직접 발급한
            OpenAI 키를 넣으면 암호화해 저장하고, AI 호출 때 서버에서만 복호화합니다. 키는 브라우저에
            남지 않습니다.
          </div>

          <div className="mt-3 flex items-end gap-2">
            <label className="block flex-1">
              <span className="field-label">OpenAI API 키</span>
              <input
                className="field-input"
                type="password"
                autoComplete="off"
                spellCheck={false}
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value)
                  if (saveError) setSaveError(false)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && canSaveKey) void onSaveKey()
                }}
                placeholder={llmConfigured ? '새 키로 교체 (sk-…)' : 'sk-…'}
                disabled={!isSupabaseConfigured || saving}
              />
            </label>
            <button
              className="btn border border-body-border bg-white shrink-0"
              disabled={!canSaveKey}
              onClick={onSaveKey}
            >
              {saving ? '저장 중…' : llmConfigured ? '교체' : '연결'}
            </button>
          </div>

          {!isSupabaseConfigured ? (
            <p className="mt-2 text-[11px] leading-relaxed text-accent-strong">
              먼저 로그인·데이터베이스 연결이 필요합니다.
            </p>
          ) : saveError ? (
            <p className="mt-2 text-[11px] leading-relaxed text-accent-strong">
              저장에 실패했어요. 키를 다시 확인해 주세요.
            </p>
          ) : llmConfigured ? (
            <p className="mt-2 text-[11px] leading-relaxed text-body-muted">
              연결되어 있어요. 새 키를 넣으면 교체됩니다. 저장된 키는 다시 보여드리지 않습니다.
            </p>
          ) : (
            <p className="mt-2 text-[11px] leading-relaxed text-body-muted">
              키는 AES-256-GCM으로 암호화해 보관하며, 저장 직후 입력값은 비워집니다.
            </p>
          )}
        </div>
      </section>

      {/* ③ 내 Supabase 연결 — BYO 데이터 분리(실동작) ──────────── */}
      <section className="panel p-5">
        <div className="section-head">
          <div className="flex items-baseline gap-2">
            <h2 className="text-sm font-semibold text-body-text">내 Supabase 연결</h2>
            {dbStatus === null ? (
              <span className="meta-chip shrink-0">
                <span aria-hidden className="accent-dot animate-pulse" />
                확인 중
              </span>
            ) : dbStatus.connected && dbStatus.provisioned ? (
              <span className="meta-chip shrink-0">
                <span aria-hidden className="status-dot-published" />
                연결됨 · 스키마 적용됨
              </span>
            ) : dbStatus.connected ? (
              <span className="shrink-0 rounded-full bg-accent-soft px-2.5 py-1 text-[11px] font-medium text-accent-strong">
                연결됨 · 스키마 미적용
              </span>
            ) : (
              <span className="shrink-0 rounded-full bg-accent-soft px-2.5 py-1 text-[11px] font-medium text-accent-strong">
                미연결
              </span>
            )}
          </div>
        </div>
        <p className="mt-1 text-sm leading-relaxed text-body-muted">
          연결하면 본인 Supabase로 데이터를 옮길 준비가 됩니다. 데이터 라우팅 전환은 준비 중이라,
          지금은 모든 데이터가 몸소 중앙에 안전 보관됩니다. 로그인·계정·기본 용어집은 항상 중앙에 남습니다.
        </p>

        {dbStatus?.connected && dbStatus.urlMasked && (
          <div className="mt-3 list-row">
            <div className="min-w-0 flex-1">
              <div className="font-medium text-body-text">연결된 프로젝트</div>
              <div className="mt-0.5 font-mono text-[11px] leading-relaxed text-body-muted">
                {dbStatus.urlMasked}
              </div>
            </div>
            <button
              className="btn btn-ghost shrink-0"
              disabled={dbDisconnecting}
              onClick={onDisconnectDb}
            >
              {dbDisconnecting ? '해제 중…' : '연결 해제'}
            </button>
          </div>
        )}

        <div className="mt-3 rounded-[6px] bg-sage px-3 py-3">
          <div className="text-[11px] leading-relaxed text-body-muted">
            <span className="font-medium text-body-text">내 데이터, 내 인프라</span> — 프로젝트 URL과
            anon 키, service 키를 넣으면 데이터가 본인 Supabase에 저장됩니다. service 키는
            AES-256-GCM으로 암호화해 보관하고, 고객 DB 접근이 필요할 때 서버에서만 복호화합니다. 키는
            브라우저에 남지 않습니다.
          </div>
          <div className="mt-2 text-[11px] leading-relaxed text-body-muted">
            연결 전, 데이터 스키마를 본인 Supabase SQL 에디터에 한 번 적용하세요 —{' '}
            <a
              href="/customer-db-schema.sql"
              download
              className="font-medium text-accent-strong underline underline-offset-2"
            >
              스키마 SQL 받기
            </a>
          </div>

          <div className="mt-3 space-y-2">
            <label className="block">
              <span className="field-label">프로젝트 URL</span>
              <input
                className="field-input"
                autoComplete="off"
                spellCheck={false}
                value={dbUrl}
                onChange={(e) => {
                  setDbUrl(e.target.value)
                  if (dbError) setDbError(false)
                }}
                placeholder="https://xxxxxxxx.supabase.co"
                disabled={!isSupabaseConfigured || dbSaving}
              />
            </label>
            <label className="block">
              <span className="field-label">anon 키 (공개 키)</span>
              <input
                className="field-input"
                type="password"
                autoComplete="off"
                spellCheck={false}
                value={dbAnonKey}
                onChange={(e) => {
                  setDbAnonKey(e.target.value)
                  if (dbError) setDbError(false)
                }}
                placeholder="eyJ… (anon / publishable)"
                disabled={!isSupabaseConfigured || dbSaving}
              />
            </label>
            <label className="block">
              <span className="field-label">service 키 (암호화 보관)</span>
              <input
                className="field-input"
                type="password"
                autoComplete="off"
                spellCheck={false}
                value={dbServiceKey}
                onChange={(e) => {
                  setDbServiceKey(e.target.value)
                  if (dbError) setDbError(false)
                }}
                placeholder="eyJ… (service_role)"
                disabled={!isSupabaseConfigured || dbSaving}
              />
            </label>
          </div>

          <div className="mt-3 flex justify-end">
            <button
              className="btn border border-body-border bg-white shrink-0"
              disabled={!canConnectDb}
              onClick={onConnectDb}
            >
              {dbSaving ? '연결 중…' : dbStatus?.connected ? '다시 연결' : '연결'}
            </button>
          </div>

          {!isSupabaseConfigured ? (
            <p className="mt-2 text-[11px] leading-relaxed text-accent-strong">
              먼저 로그인·데이터베이스 연결이 필요합니다.
            </p>
          ) : dbError ? (
            <p className="mt-2 text-[11px] leading-relaxed text-accent-strong">
              연결에 실패했어요. URL과 키를 다시 확인해 주세요.
            </p>
          ) : dbStatus?.connected && !dbStatus.provisioned ? (
            <p className="mt-2 text-[11px] leading-relaxed text-accent-strong">
              연결은 저장됐지만 데이터 스키마가 아직 적용되지 않았어요. 위 ‘스키마 SQL 받기’로 받은
              스키마를 본인 Supabase에 한 번 적용한 뒤 다시 연결을 눌러주세요. 적용 전까지 데이터는
              안전하게 몸소 중앙에 보관됩니다.
            </p>
          ) : dbStatus?.connected && dbStatus.provisioned ? (
            <p className="mt-2 text-[11px] leading-relaxed text-body-muted">
              본인 Supabase에 데이터 스키마가 적용돼 있어요. service 키는 다시 보여드리지 않습니다.
            </p>
          ) : (
            <p className="mt-2 text-[11px] leading-relaxed text-body-muted">
              service 키는 AES-256-GCM으로 암호화해 보관하며, 저장 직후 입력값은 비워집니다.
            </p>
          )}
        </div>
      </section>

      {/* ④ 몸소 딕셔너리 — 기본 제공 요가 용어집(실데이터) ── */}
      <section className="panel p-5">
        <div className="section-head">
          <div className="flex items-baseline gap-2">
            <h2 className="text-sm font-semibold text-body-text">몸소 딕셔너리</h2>
            <span className="text-sm font-normal text-body-muted">{dict.length}</span>
          </div>
        </div>
        <p className="mt-1 text-sm leading-relaxed text-body-muted">
          몸소가 제공하는 기본 요가 용어집. 전사 보정·검색의 표준 표기 기준이 됩니다. 내 요가원 전용
          용어 편집은 베타에서 열립니다.
        </p>

        {dict.length === 0 ? (
          <div className="empty-state mt-3">
            <span aria-hidden className="accent-rule" />
            <div className="empty-state-title mt-3">용어를 불러오는 중이에요</div>
            <p className="empty-state-body mt-2">
              잠시 후에도 비어 있으면 로그인·데이터베이스 연결을 확인해 주세요.
            </p>
          </div>
        ) : (
          <div className="mt-3 max-h-80 space-y-4 overflow-y-auto pr-1">
            {[
              { key: 'asana', label: '아사나(자세)' },
              { key: 'breath', label: '호흡' },
              { key: 'lock', label: '반다·무드라·시선' },
              { key: 'philosophy', label: '철학' },
              { key: 'anatomy', label: '해부·정렬' },
              { key: 'style', label: '스타일' },
            ].map((g) => {
              const items = dict.filter((t) => t.category === g.key)
              if (items.length === 0) return null
              return (
                <div key={g.key}>
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-[13px] font-semibold text-body-text">{g.label}</h3>
                    <span className="text-[13px] font-normal text-body-muted">{items.length}</span>
                  </div>
                  <ul className="mt-2 space-y-1.5">
                    {items.map((t) => (
                      <li key={t.term} className="list-row">
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-body-text">
                            {t.reading || t.term}
                            <span className="ml-1.5 text-[11px] font-normal text-body-muted">
                              {t.term}
                            </span>
                          </div>
                          {t.note && (
                            <div className="mt-0.5 text-[11px] leading-relaxed text-body-muted">
                              {t.note}
                            </div>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
        )}
        <p className="mt-3 text-[11px] leading-relaxed text-body-muted">
          v0 초안 — 도메인 검수 전입니다. 표기가 어색하면 검수해 반영할게요.
        </p>
      </section>

      {/* ⑤ 계정 — 실값(useAuth). 상세는 여기 1곳 ─────────────────── */}
      <section className="panel p-5">
        <div className="section-head">
          <h2 className="text-sm font-semibold text-body-text">계정</h2>
        </div>

        <div className="mt-3 flex items-center gap-3">
          <span
            aria-hidden
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sage text-sm font-semibold text-body-text"
          >
            {initial}
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate font-medium text-body-text">
              {user?.name ?? user?.email ?? '강사'}
            </div>
            {user?.email && <div className="truncate text-sm text-body-muted">{user.email}</div>}
          </div>
          <button className="btn btn-ghost shrink-0" onClick={signOut}>
            로그아웃
          </button>
        </div>
      </section>
    </div>
  )
}