import { z } from 'zod'
import {
  authorityGradeValues,
  inputModeValues,
  layerIdValues,
  memoTypeValues,
} from './catalog'

export const authorityGradeSchema = z.enum(authorityGradeValues)
export type AuthorityGrade = z.infer<typeof authorityGradeSchema>

export const layerIdSchema = z.enum(layerIdValues)
export type LayerId = z.infer<typeof layerIdSchema>

export const inputModeSchema = z.enum(inputModeValues)
export type InputMode = z.infer<typeof inputModeSchema>

export const memoTypeSchema = z.enum(memoTypeValues)
export type MemoType = z.infer<typeof memoTypeSchema>

const timestampSchema = z.string().datetime({ offset: true })

export const vector3Schema = z.object({
  x: z.number(),
  y: z.number(),
  z: z.number(),
})
export type Vector3 = z.infer<typeof vector3Schema>

export const frameRangeSchema = z
  .object({
    start: z.number().int().min(0).max(100),
    end: z.number().int().min(0).max(100),
  })
  .refine((value) => value.start <= value.end, {
    message: 'frameRange start must be less than or equal to end',
    path: ['end'],
  })
export type FrameRange = z.infer<typeof frameRangeSchema>

export const layerProfileSchema = z.object({
  layerId: layerIdSchema,
  visible: z.boolean().default(true),
  emphasis: z.number().min(0).max(1).default(0.5),
  opacity: z.number().min(0).max(1).default(1),
})
export type LayerProfile = z.infer<typeof layerProfileSchema>

export const layerEmphasisEntrySchema = z.object({
  layerId: layerIdSchema,
  emphasis: z.number().min(0).max(1),
})
export type LayerEmphasisEntry = z.infer<typeof layerEmphasisEntrySchema>

export const frameCueSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  range: frameRangeSchema,
  focusEntityIds: z.array(z.string().min(1)).default([]),
  layerEmphasis: z.array(layerEmphasisEntrySchema).default([]),
  cameraViewId: z.string().min(1).nullable().default(null),
})
export type FrameCue = z.infer<typeof frameCueSchema>

export const anchorSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  entityId: z.string().min(1),
  position: vector3Schema,
  cameraViewId: z.string().min(1),
})
export type Anchor = z.infer<typeof anchorSchema>

export const cameraViewSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  position: vector3Schema,
  target: vector3Schema,
})
export type CameraView = z.infer<typeof cameraViewSchema>

export const registryEntitySchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  layerId: layerIdSchema,
  authorityGrade: authorityGradeSchema,
  description: z.string().min(1),
  anchorId: z.string().min(1),
  aliases: z.array(z.string().min(1)).default([]),
  displayColor: z.string().min(1),
  focusRadius: z.number().positive().default(0.22),
})
export type RegistryEntity = z.infer<typeof registryEntitySchema>

export const registryBundleSchema = z.object({
  entities: z.array(registryEntitySchema),
  anchors: z.array(anchorSchema),
  cameraViews: z.array(cameraViewSchema),
})
export type RegistryBundle = z.infer<typeof registryBundleSchema>

export const projectSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  title: z.string().min(1),
  description: z.string(),
  activeActionFamilyId: z.string().uuid(),
  activeActionInstanceId: z.string().uuid(),
  defaultCameraViewId: z.string().min(1),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
})
export type Project = z.infer<typeof projectSchema>

export const actionFamilySchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  slug: z.string().min(1),
  title: z.string().min(1),
  description: z.string(),
  frameCount: z.number().int().positive(),
  defaultCameraViewId: z.string().min(1),
  layerDefaults: z.array(layerProfileSchema),
  cues: z.array(frameCueSchema),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
})
export type ActionFamily = z.infer<typeof actionFamilySchema>

export const actionInstanceSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  familyId: z.string().uuid(),
  title: z.string().min(1),
  description: z.string(),
  frameCount: z.number().int().positive(),
  layerOverrides: z.array(layerProfileSchema),
  cueOverrides: z.array(frameCueSchema),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
})
export type ActionInstance = z.infer<typeof actionInstanceSchema>

export const mentionSchema = z.object({
  token: z.string().min(1),
  entityId: z.string().min(1),
  label: z.string().min(1),
  anchorId: z.string().min(1),
  start: z.number().int().min(0),
  end: z.number().int().min(0),
})
export type Mention = z.infer<typeof mentionSchema>

export const threadSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  actionInstanceId: z.string().uuid().nullable(),
  title: z.string().min(1),
  summary: z.string(),
  targetEntityId: z.string().min(1),
  anchorId: z.string().min(1),
  cameraViewId: z.string().min(1),
  frameStart: z.number().int().min(0).max(100),
  frameEnd: z.number().int().min(0).max(100),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
})
export type Thread = z.infer<typeof threadSchema>

export const threadMemoSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  threadId: z.string().uuid(),
  memoType: memoTypeSchema,
  frame: z.number().int().min(0).max(100).nullable(),
  body: z.string(),
  mentions: z.array(mentionSchema),
  transcriptSource: z.string().nullable(),
  transcriptReviewed: z.boolean().default(false),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
})
export type ThreadMemo = z.infer<typeof threadMemoSchema>

export const projectSettingsSchema = z.object({
  projectId: z.string().uuid(),
  inputMode: inputModeSchema,
  selectedAudioInputDeviceId: z.string().nullable(),
  saveRawAudio: z.boolean(),
  lastOpenedFrame: z.number().int().min(0).max(100),
  lastSelectedThreadId: z.string().uuid().nullable(),
  lastSelectedEntityId: z.string().nullable(),
  updatedAt: timestampSchema,
})
export type ProjectSettings = z.infer<typeof projectSettingsSchema>

export const workspaceSnapshotSchema = z.object({
  project: projectSchema,
  actionFamily: actionFamilySchema,
  actionInstance: actionInstanceSchema,
  settings: projectSettingsSchema,
  threads: z.array(threadSchema),
  memos: z.array(threadMemoSchema),
  registry: registryBundleSchema,
})
export type WorkspaceSnapshot = z.infer<typeof workspaceSnapshotSchema>

export const threadDraftSchema = z.object({
  title: z.string().min(1),
  summary: z.string(),
  targetEntityId: z.string().min(1),
  anchorId: z.string().min(1),
  cameraViewId: z.string().min(1),
  frameStart: z.number().int().min(0).max(100),
  frameEnd: z.number().int().min(0).max(100),
})
export type ThreadDraft = z.infer<typeof threadDraftSchema>

export const resolvedLayerStateSchema = z.object({
  layerId: layerIdSchema,
  label: z.string().min(1),
  authorityGrade: authorityGradeSchema,
  runtimeMode: z.string().min(1),
  accent: z.string().min(1),
  visible: z.boolean(),
  emphasis: z.number().min(0).max(1),
  opacity: z.number().min(0).max(1),
})
export type ResolvedLayerState = z.infer<typeof resolvedLayerStateSchema>

export const resolvedFrameStateSchema = z.object({
  frame: z.number().int().min(0).max(100),
  phaseLabel: z.string().min(1),
  cameraViewId: z.string().min(1),
  focusEntityIds: z.array(z.string().min(1)),
  activeCueIds: z.array(z.string().min(1)),
  layers: z.array(resolvedLayerStateSchema),
})
export type ResolvedFrameState = z.infer<typeof resolvedFrameStateSchema>
