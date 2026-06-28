import { useSyncExternalStore } from 'react'
import { getSupabase } from './supabase/client'

/** 워크스페이스 = 요가원/스튜디오 단위 경계. 활성 워크스페이스가 모든 데이터를 스코프. */
export type Workspace = { id: string; name: string; createdAt: number }

type WState = { workspaces: Workspace[]; activeId: string | null; loaded: boolean }

let state: WState = { workspaces: [], activeId: null, loaded: false }
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())
const subscribe = (cb: () => void) => {
  listeners.add(cb)
  return () => {
    listeners.delete(cb)
  }
}
const getSnapshot = () => state

const ACTIVE_KEY = 'momso_active_workspace'
const readActive = (): string | null => {
  try {
    return localStorage.getItem(ACTIVE_KEY)
  } catch {
    return null
  }
}
const writeActive = (id: string | null) => {
  try {
    if (id) localStorage.setItem(ACTIVE_KEY, id)
    else localStorage.removeItem(ACTIVE_KEY)
  } catch {
    /* 무시 */
  }
}

type Row = { id: string; name: string; created_at: string }
const toW = (r: Row): Workspace => ({ id: r.id, name: r.name, createdAt: new Date(r.created_at).getTime() })

export function useWorkspaces() {
  const s = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
  const active = s.workspaces.find((w) => w.id === s.activeId) ?? null
  return { workspaces: s.workspaces, active, activeId: s.activeId, loaded: s.loaded }
}

/** 비-React용 — 현재 활성 워크스페이스 id. */
export function activeWorkspaceId(): string | null {
  return state.activeId
}

let inFlight: Promise<void> | null = null

/** 로그인 후 호출 — 워크스페이스 로드. 동시 호출은 1개로 dedupe(기본 워크스페이스 중복 생성 방지). 없으면 기본 1개 생성. */
export function loadWorkspaces(): Promise<void> {
  if (inFlight) return inFlight
  inFlight = doLoadWorkspaces().finally(() => {
    inFlight = null
  })
  return inFlight
}

async function doLoadWorkspaces(): Promise<void> {
  const sb = getSupabase()
  if (!sb) {
    state = { workspaces: [], activeId: null, loaded: true }
    emit()
    return
  }
  let res = await sb.from('workspace').select('*').order('created_at', { ascending: true })
  if (res.error) {
    await sb.auth.getSession() // 토큰 갱신 레이스 대비
    res = await sb.from('workspace').select('*').order('created_at', { ascending: true })
  }
  let rows = (res.data as Row[] | null) ?? []
  if (rows.length === 0) {
    const ins = await sb.from('workspace').insert({ name: '내 요가원' }).select().single()
    if (ins.error) console.error('createDefaultWorkspace', JSON.stringify(ins.error))
    if (ins.data) rows = [ins.data as Row]
  }
  const workspaces = rows.map(toW)
  const stored = readActive()
  const activeId = workspaces.find((w) => w.id === stored)?.id ?? workspaces[0]?.id ?? null
  writeActive(activeId)
  state = { workspaces, activeId, loaded: true }
  emit()
}

export function setActiveWorkspace(id: string): void {
  writeActive(id)
  state = { ...state, activeId: id }
  emit()
}

export async function createWorkspace(name: string): Promise<Workspace | null> {
  const sb = getSupabase()
  if (!sb) return null
  const { data, error } = await sb.from('workspace').insert({ name }).select().single()
  if (error || !data) {
    console.error('createWorkspace', JSON.stringify(error))
    return null
  }
  const w = toW(data as Row)
  state = { ...state, workspaces: [...state.workspaces, w], activeId: w.id }
  writeActive(w.id)
  emit()
  return w
}

export function clearWorkspaces(): void {
  state = { workspaces: [], activeId: null, loaded: false }
  emit()
}
