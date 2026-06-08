import { create } from 'zustand'
import {
  canonicalFrameDomain,
  inputModeCatalog,
  layerCatalog,
  type InputMode,
  type LayerId,
  type MemoType,
} from '@momso/schema'

type LayerVisibilityMask = Record<LayerId, boolean>

function createInitialLayerVisibility(): LayerVisibilityMask {
  return layerCatalog.reduce<LayerVisibilityMask>(
    (visibility, layer) => {
      visibility[layer.id] = true
      return visibility
    },
    {
      skeleton: true,
      muscle: true,
      ligament: true,
      nerve: true,
      meridian: true,
      acupoint: true,
      myofascial_line: true,
    },
  )
}

interface HydrationPayload {
  projectId: string
  frame: number
  inputMode: InputMode
  selectedThreadId: string | null
  selectedEntityId: string | null
}

interface WorkspaceState {
  sidebarCollapsed: boolean
  hydratedProjectId: string | null
  targetFrame: number
  resolvedFrame: number
  selectedThreadId: string | null
  selectedEntityId: string | null
  focusedEntityId: string | null
  activeMemoType: MemoType
  inputMode: InputMode
  layerVisibility: LayerVisibilityMask
  editorDrafts: Record<string, string>
  toggleSidebar: () => void
  toggleLayer: (layerId: LayerId) => void
  setTargetFrame: (frame: number) => void
  setResolvedFrame: (frame: number) => void
  selectThread: (threadId: string | null) => void
  selectEntity: (entityId: string | null) => void
  setFocusedEntity: (entityId: string | null) => void
  setActiveMemoType: (memoType: MemoType) => void
  setInputMode: (mode: InputMode) => void
  updateDraft: (draftKey: string, value: string) => void
  setDraft: (draftKey: string, value: string) => void
  clearDraft: (draftKey: string) => void
  hydrateProject: (payload: HydrationPayload) => void
  resetSelection: () => void
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  sidebarCollapsed: false,
  hydratedProjectId: null,
  targetFrame: 24,
  resolvedFrame: 24,
  selectedThreadId: null,
  selectedEntityId: null,
  focusedEntityId: null,
  activeMemoType: 'global',
  inputMode: inputModeCatalog.find((mode) => mode.id === 'hybrid')?.id ?? 'text',
  layerVisibility: createInitialLayerVisibility(),
  editorDrafts: {},
  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  toggleLayer: (layerId) =>
    set((state) => ({
      layerVisibility: {
        ...state.layerVisibility,
        [layerId]: !state.layerVisibility[layerId],
      },
    })),
  setTargetFrame: (frame) =>
    set({
      targetFrame: Math.min(
        canonicalFrameDomain.max,
        Math.max(canonicalFrameDomain.min, Math.round(frame)),
      ),
    }),
  setResolvedFrame: (frame) =>
    set({
      resolvedFrame: Math.min(
        canonicalFrameDomain.max,
        Math.max(canonicalFrameDomain.min, Math.round(frame)),
      ),
    }),
  selectThread: (threadId) => set({ selectedThreadId: threadId }),
  selectEntity: (entityId) => set({ selectedEntityId: entityId }),
  setFocusedEntity: (entityId) => set({ focusedEntityId: entityId }),
  setActiveMemoType: (memoType) => set({ activeMemoType: memoType }),
  setInputMode: (mode) => set({ inputMode: mode }),
  updateDraft: (draftKey, value) =>
    set((state) => ({
      editorDrafts: {
        ...state.editorDrafts,
        [draftKey]: value,
      },
    })),
  setDraft: (draftKey, value) =>
    set((state) => ({
      editorDrafts: {
        ...state.editorDrafts,
        [draftKey]: value,
      },
    })),
  clearDraft: (draftKey) =>
    set((state) => {
      const nextDrafts = { ...state.editorDrafts }
      delete nextDrafts[draftKey]

      return {
        editorDrafts: nextDrafts,
      }
    }),
  hydrateProject: (payload) =>
    set((state) => ({
      hydratedProjectId: payload.projectId,
      targetFrame: payload.frame,
      resolvedFrame: payload.frame,
      inputMode: payload.inputMode,
      selectedThreadId: payload.selectedThreadId,
      selectedEntityId: payload.selectedEntityId,
      focusedEntityId: payload.selectedEntityId,
      activeMemoType: state.hydratedProjectId === payload.projectId ? state.activeMemoType : 'global',
      editorDrafts:
        state.hydratedProjectId === payload.projectId ? state.editorDrafts : {},
      layerVisibility:
        state.hydratedProjectId === payload.projectId
          ? state.layerVisibility
          : createInitialLayerVisibility(),
    })),
  resetSelection: () =>
    set({
      selectedThreadId: null,
      selectedEntityId: null,
      focusedEntityId: null,
    }),
}))
