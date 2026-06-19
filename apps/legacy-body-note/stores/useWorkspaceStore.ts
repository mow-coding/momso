import { create } from 'zustand'
import {
  layerCatalog,
  threadCatalog,
  type InputMode,
  type LayerId,
  type ThreadId,
} from './workspaceSeed'

type LayerVisibilityMask = Record<LayerId, boolean>

const initialLayerVisibility = layerCatalog.reduce<LayerVisibilityMask>(
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

const initialDrafts = threadCatalog.reduce<Record<ThreadId, string>>(
  (drafts, thread) => {
    drafts[thread.id] = thread.body
    return drafts
  },
  {
    'thread.glute-hinge': '',
    'thread.knee-drive': '',
    'thread.meridian-context': '',
  },
)

interface WorkspaceState {
  sidebarCollapsed: boolean
  targetFrame: number
  resolvedFrame: number
  selectedThreadId: ThreadId
  inputMode: InputMode
  layerVisibility: LayerVisibilityMask
  editorDrafts: Record<ThreadId, string>
  toggleSidebar: () => void
  toggleLayer: (layerId: LayerId) => void
  setTargetFrame: (frame: number) => void
  setResolvedFrame: (frame: number) => void
  selectThread: (threadId: ThreadId) => void
  setInputMode: (mode: InputMode) => void
  updateDraft: (threadId: ThreadId, value: string) => void
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  sidebarCollapsed: false,
  targetFrame: 24,
  resolvedFrame: 24,
  selectedThreadId: 'thread.glute-hinge',
  inputMode: 'hybrid',
  layerVisibility: initialLayerVisibility,
  editorDrafts: initialDrafts,
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
      targetFrame: Math.min(100, Math.max(0, Math.round(frame))),
    }),
  setResolvedFrame: (frame) =>
    set({
      resolvedFrame: Math.min(100, Math.max(0, Math.round(frame))),
    }),
  selectThread: (threadId) => set({ selectedThreadId: threadId }),
  setInputMode: (mode) => set({ inputMode: mode }),
  updateDraft: (threadId, value) =>
    set((state) => ({
      editorDrafts: {
        ...state.editorDrafts,
        [threadId]: value,
      },
    })),
}))
