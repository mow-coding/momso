export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      action_families: {
        Row: {
          id: string
          project_id: string
          slug: string
          title: string
          description: string
          frame_count: number
          default_camera_view_id: string
          layer_defaults: Json
          cues: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          project_id: string
          slug: string
          title: string
          description?: string
          frame_count?: number
          default_camera_view_id: string
          layer_defaults: Json
          cues: Json
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['action_families']['Insert']>
        Relationships: []
      }
      action_instances: {
        Row: {
          id: string
          project_id: string
          family_id: string
          title: string
          description: string
          frame_count: number
          layer_overrides: Json
          cue_overrides: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          project_id: string
          family_id: string
          title: string
          description?: string
          frame_count?: number
          layer_overrides: Json
          cue_overrides: Json
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['action_instances']['Insert']>
        Relationships: []
      }
      project_settings: {
        Row: {
          project_id: string
          input_mode: 'text' | 'mic' | 'hybrid'
          selected_audio_input_device_id: string | null
          save_raw_audio: boolean
          last_opened_frame: number
          last_selected_thread_id: string | null
          last_selected_entity_id: string | null
          updated_at: string
        }
        Insert: {
          project_id: string
          input_mode?: 'text' | 'mic' | 'hybrid'
          selected_audio_input_device_id?: string | null
          save_raw_audio?: boolean
          last_opened_frame?: number
          last_selected_thread_id?: string | null
          last_selected_entity_id?: string | null
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['project_settings']['Insert']>
        Relationships: []
      }
      projects: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string
          active_action_family_id: string
          active_action_instance_id: string
          default_camera_view_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          user_id: string
          title: string
          description?: string
          active_action_family_id: string
          active_action_instance_id: string
          default_camera_view_id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['projects']['Insert']>
        Relationships: []
      }
      thread_memos: {
        Row: {
          id: string
          project_id: string
          thread_id: string
          memo_type: 'global' | 'keyframed'
          frame: number | null
          body: string
          mentions: Json
          transcript_source: string | null
          transcript_reviewed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          project_id: string
          thread_id: string
          memo_type: 'global' | 'keyframed'
          frame?: number | null
          body?: string
          mentions?: Json
          transcript_source?: string | null
          transcript_reviewed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['thread_memos']['Insert']>
        Relationships: []
      }
      threads: {
        Row: {
          id: string
          project_id: string
          action_instance_id: string | null
          title: string
          summary: string
          target_entity_id: string
          anchor_id: string
          camera_view_id: string
          frame_start: number
          frame_end: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          project_id: string
          action_instance_id?: string | null
          title: string
          summary?: string
          target_entity_id: string
          anchor_id: string
          camera_view_id: string
          frame_start?: number
          frame_end?: number
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['threads']['Insert']>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
