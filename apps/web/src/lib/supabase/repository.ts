import type { Session, SupabaseClient } from '@supabase/supabase-js'
import {
  actionFamilySchema,
  actionInstanceSchema,
  anatomyRegistry,
  createStarterWorkspace,
  projectSchema,
  projectSettingsSchema,
  threadMemoSchema,
  threadSchema,
  workspaceSnapshotSchema,
  type ProjectSettings,
  type Thread,
  type ThreadMemo,
  type WorkspaceSnapshot,
} from '@momso/schema'
import type { Database } from './database'

type Client = SupabaseClient<Database>

function requireData<T>(value: T | null, message: string): T {
  if (!value) {
    throw new Error(message)
  }

  return value
}

function mapProject(row: Database['public']['Tables']['projects']['Row']) {
  return projectSchema.parse({
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description,
    activeActionFamilyId: row.active_action_family_id,
    activeActionInstanceId: row.active_action_instance_id,
    defaultCameraViewId: row.default_camera_view_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  })
}

function mapActionFamily(
  row: Database['public']['Tables']['action_families']['Row'],
): WorkspaceSnapshot['actionFamily'] {
  return actionFamilySchema.parse({
    id: row.id,
    projectId: row.project_id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    frameCount: row.frame_count,
    defaultCameraViewId: row.default_camera_view_id,
    layerDefaults: row.layer_defaults,
    cues: row.cues,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  })
}

function mapActionInstance(
  row: Database['public']['Tables']['action_instances']['Row'],
): WorkspaceSnapshot['actionInstance'] {
  return actionInstanceSchema.parse({
    id: row.id,
    projectId: row.project_id,
    familyId: row.family_id,
    title: row.title,
    description: row.description,
    frameCount: row.frame_count,
    layerOverrides: row.layer_overrides,
    cueOverrides: row.cue_overrides,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  })
}

function mapThread(row: Database['public']['Tables']['threads']['Row']) {
  return threadSchema.parse({
    id: row.id,
    projectId: row.project_id,
    actionInstanceId: row.action_instance_id,
    title: row.title,
    summary: row.summary,
    targetEntityId: row.target_entity_id,
    anchorId: row.anchor_id,
    cameraViewId: row.camera_view_id,
    frameStart: row.frame_start,
    frameEnd: row.frame_end,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  })
}

function mapMemo(row: Database['public']['Tables']['thread_memos']['Row']) {
  return threadMemoSchema.parse({
    id: row.id,
    projectId: row.project_id,
    threadId: row.thread_id,
    memoType: row.memo_type,
    frame: row.frame,
    body: row.body,
    mentions: row.mentions,
    transcriptSource: row.transcript_source,
    transcriptReviewed: row.transcript_reviewed,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  })
}

function mapSettings(row: Database['public']['Tables']['project_settings']['Row']) {
  return projectSettingsSchema.parse({
    projectId: row.project_id,
    inputMode: row.input_mode,
    selectedAudioInputDeviceId: row.selected_audio_input_device_id,
    saveRawAudio: row.save_raw_audio,
    lastOpenedFrame: row.last_opened_frame,
    lastSelectedThreadId: row.last_selected_thread_id,
    lastSelectedEntityId: row.last_selected_entity_id,
    updatedAt: row.updated_at,
  })
}

export async function signInWithEmailOtp(client: Client, email: string) {
  const redirectTo =
    typeof window === 'undefined'
      ? undefined
      : `${window.location.origin}${window.location.pathname}`

  const { error } = await client.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: redirectTo,
    },
  })

  if (error) {
    throw error
  }
}

export async function signOut(client: Client) {
  const { error } = await client.auth.signOut()

  if (error) {
    throw error
  }
}

export async function listProjects(client: Client, userId: string) {
  const { data, error } = await client
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })

  if (error) {
    throw error
  }

  return (
    (data ?? []) as Database['public']['Tables']['projects']['Row'][]
  ).map(mapProject)
}

export async function createProjectFromStarter(
  client: Client,
  userId: string,
  options?: {
    title?: string
  },
) {
  const snapshot = createStarterWorkspace(userId, {
    projectTitle: options?.title,
  })

  const { error: projectError } = await client.from('projects').insert({
    id: snapshot.project.id,
    user_id: snapshot.project.userId,
    title: snapshot.project.title,
    description: snapshot.project.description,
    active_action_family_id: snapshot.project.activeActionFamilyId,
    active_action_instance_id: snapshot.project.activeActionInstanceId,
    default_camera_view_id: snapshot.project.defaultCameraViewId,
    created_at: snapshot.project.createdAt,
    updated_at: snapshot.project.updatedAt,
  })

  if (projectError) {
    throw projectError
  }

  const { error: familyError } = await client.from('action_families').insert({
    id: snapshot.actionFamily.id,
    project_id: snapshot.actionFamily.projectId,
    slug: snapshot.actionFamily.slug,
    title: snapshot.actionFamily.title,
    description: snapshot.actionFamily.description,
    frame_count: snapshot.actionFamily.frameCount,
    default_camera_view_id: snapshot.actionFamily.defaultCameraViewId,
    layer_defaults: snapshot.actionFamily.layerDefaults,
    cues: snapshot.actionFamily.cues,
    created_at: snapshot.actionFamily.createdAt,
    updated_at: snapshot.actionFamily.updatedAt,
  })

  if (familyError) {
    throw familyError
  }

  const { error: instanceError } = await client.from('action_instances').insert({
    id: snapshot.actionInstance.id,
    project_id: snapshot.actionInstance.projectId,
    family_id: snapshot.actionInstance.familyId,
    title: snapshot.actionInstance.title,
    description: snapshot.actionInstance.description,
    frame_count: snapshot.actionInstance.frameCount,
    layer_overrides: snapshot.actionInstance.layerOverrides,
    cue_overrides: snapshot.actionInstance.cueOverrides,
    created_at: snapshot.actionInstance.createdAt,
    updated_at: snapshot.actionInstance.updatedAt,
  })

  if (instanceError) {
    throw instanceError
  }

  if (snapshot.threads.length > 0) {
    const { error: threadError } = await client.from('threads').insert(
      snapshot.threads.map((thread) => ({
        id: thread.id,
        project_id: thread.projectId,
        action_instance_id: thread.actionInstanceId,
        title: thread.title,
        summary: thread.summary,
        target_entity_id: thread.targetEntityId,
        anchor_id: thread.anchorId,
        camera_view_id: thread.cameraViewId,
        frame_start: thread.frameStart,
        frame_end: thread.frameEnd,
        created_at: thread.createdAt,
        updated_at: thread.updatedAt,
      })),
    )

    if (threadError) {
      throw threadError
    }
  }

  if (snapshot.memos.length > 0) {
    const { error: memoError } = await client.from('thread_memos').insert(
      snapshot.memos.map((memo) => ({
        id: memo.id,
        project_id: memo.projectId,
        thread_id: memo.threadId,
        memo_type: memo.memoType,
        frame: memo.frame,
        body: memo.body,
        mentions: memo.mentions,
        transcript_source: memo.transcriptSource,
        transcript_reviewed: memo.transcriptReviewed,
        created_at: memo.createdAt,
        updated_at: memo.updatedAt,
      })),
    )

    if (memoError) {
      throw memoError
    }
  }

  const { error: settingsError } = await client.from('project_settings').insert({
    project_id: snapshot.settings.projectId,
    input_mode: snapshot.settings.inputMode,
    selected_audio_input_device_id: snapshot.settings.selectedAudioInputDeviceId,
    save_raw_audio: snapshot.settings.saveRawAudio,
    last_opened_frame: snapshot.settings.lastOpenedFrame,
    last_selected_thread_id: snapshot.settings.lastSelectedThreadId,
    last_selected_entity_id: snapshot.settings.lastSelectedEntityId,
    updated_at: snapshot.settings.updatedAt,
  })

  if (settingsError) {
    throw settingsError
  }

  return snapshot
}

export async function ensureUserWorkspace(client: Client, session: Session) {
  const existingProjects = await listProjects(client, session.user.id)

  if (existingProjects.length > 0) {
    return {
      projects: existingProjects,
      activeProjectId: existingProjects[0].id,
    }
  }

  const starterWorkspace = await createProjectFromStarter(client, session.user.id)

  return {
    projects: [starterWorkspace.project],
    activeProjectId: starterWorkspace.project.id,
  }
}

export async function loadWorkspaceSnapshot(client: Client, projectId: string) {
  const [projectResult, familyResult, instanceResult, settingsResult, threadsResult, memosResult] =
    await Promise.all([
      client.from('projects').select('*').eq('id', projectId).single(),
      client.from('action_families').select('*').eq('project_id', projectId).limit(1).single(),
      client.from('action_instances').select('*').eq('project_id', projectId).limit(1).single(),
      client.from('project_settings').select('*').eq('project_id', projectId).single(),
      client.from('threads').select('*').eq('project_id', projectId).order('updated_at', { ascending: false }),
      client
        .from('thread_memos')
        .select('*')
        .eq('project_id', projectId)
        .order('updated_at', { ascending: false }),
    ])

  if (projectResult.error) throw projectResult.error
  if (familyResult.error) throw familyResult.error
  if (instanceResult.error) throw instanceResult.error
  if (settingsResult.error) throw settingsResult.error
  if (threadsResult.error) throw threadsResult.error
  if (memosResult.error) throw memosResult.error

  return workspaceSnapshotSchema.parse({
    project: mapProject(
      requireData(
        projectResult.data as Database['public']['Tables']['projects']['Row'] | null,
        'Project row missing',
      ),
    ),
    actionFamily: mapActionFamily(
      requireData(
        familyResult.data as Database['public']['Tables']['action_families']['Row'] | null,
        'Action family row missing',
      ),
    ),
    actionInstance: mapActionInstance(
      requireData(
        instanceResult.data as Database['public']['Tables']['action_instances']['Row'] | null,
        'Action instance row missing',
      ),
    ),
    settings: mapSettings(
      requireData(
        settingsResult.data as Database['public']['Tables']['project_settings']['Row'] | null,
        'Project settings missing',
      ),
    ),
    threads: (
      (threadsResult.data ?? []) as Database['public']['Tables']['threads']['Row'][]
    ).map(mapThread),
    memos: (
      (memosResult.data ?? []) as Database['public']['Tables']['thread_memos']['Row'][]
    ).map(mapMemo),
    registry: anatomyRegistry,
  })
}

export async function saveProjectSettings(
  client: Client,
  settings: ProjectSettings,
) {
  const { data, error } = await client
    .from('project_settings')
    .upsert({
      project_id: settings.projectId,
      input_mode: settings.inputMode,
      selected_audio_input_device_id: settings.selectedAudioInputDeviceId,
      save_raw_audio: settings.saveRawAudio,
      last_opened_frame: settings.lastOpenedFrame,
      last_selected_thread_id: settings.lastSelectedThreadId,
      last_selected_entity_id: settings.lastSelectedEntityId,
      updated_at: settings.updatedAt,
    })
    .select('*')
    .single()

  if (error) {
    throw error
  }

  return mapSettings(
    requireData(
      data as Database['public']['Tables']['project_settings']['Row'] | null,
      'Updated settings row missing',
    ),
  )
}

export async function saveThread(client: Client, thread: Thread) {
  const { data, error } = await client
    .from('threads')
    .upsert({
      id: thread.id,
      project_id: thread.projectId,
      action_instance_id: thread.actionInstanceId,
      title: thread.title,
      summary: thread.summary,
      target_entity_id: thread.targetEntityId,
      anchor_id: thread.anchorId,
      camera_view_id: thread.cameraViewId,
      frame_start: thread.frameStart,
      frame_end: thread.frameEnd,
      created_at: thread.createdAt,
      updated_at: thread.updatedAt,
    })
    .select('*')
    .single()

  if (error) {
    throw error
  }

  return mapThread(
    requireData(
      data as Database['public']['Tables']['threads']['Row'] | null,
      'Updated thread row missing',
    ),
  )
}

export async function saveMemo(client: Client, memo: ThreadMemo) {
  const { data, error } = await client
    .from('thread_memos')
    .upsert({
      id: memo.id,
      project_id: memo.projectId,
      thread_id: memo.threadId,
      memo_type: memo.memoType,
      frame: memo.frame,
      body: memo.body,
      mentions: memo.mentions,
      transcript_source: memo.transcriptSource,
      transcript_reviewed: memo.transcriptReviewed,
      created_at: memo.createdAt,
      updated_at: memo.updatedAt,
    })
    .select('*')
    .single()

  if (error) {
    throw error
  }

  return mapMemo(
    requireData(
      data as Database['public']['Tables']['thread_memos']['Row'] | null,
      'Updated memo row missing',
    ),
  )
}

export async function createProject(client: Client, userId: string, title: string) {
  const snapshot = await createProjectFromStarter(client, userId, { title })
  return snapshot.project
}
