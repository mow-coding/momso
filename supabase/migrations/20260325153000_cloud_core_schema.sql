create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  description text not null default '',
  active_action_family_id uuid not null,
  active_action_instance_id uuid not null,
  default_camera_view_id text not null default 'cam.body.left45',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.action_families (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  slug text not null,
  title text not null,
  description text not null default '',
  frame_count integer not null default 101 check (frame_count > 0),
  default_camera_view_id text not null,
  layer_defaults jsonb not null default '[]'::jsonb,
  cues jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.action_instances (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  family_id uuid not null references public.action_families (id) on delete cascade,
  title text not null,
  description text not null default '',
  frame_count integer not null default 101 check (frame_count > 0),
  layer_overrides jsonb not null default '[]'::jsonb,
  cue_overrides jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.threads (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  action_instance_id uuid references public.action_instances (id) on delete set null,
  title text not null,
  summary text not null default '',
  target_entity_id text not null,
  anchor_id text not null,
  camera_view_id text not null,
  frame_start integer not null default 0 check (frame_start between 0 and 100),
  frame_end integer not null default 100 check (frame_end between 0 and 100),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint threads_frame_window_valid check (frame_start <= frame_end)
);

create table if not exists public.thread_memos (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  thread_id uuid not null references public.threads (id) on delete cascade,
  memo_type text not null check (memo_type in ('global', 'keyframed')),
  frame integer check (frame is null or frame between 0 and 100),
  body text not null default '',
  mentions jsonb not null default '[]'::jsonb,
  transcript_source text,
  transcript_reviewed boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint thread_memos_frame_rule check (
    (memo_type = 'global' and frame is null) or
    (memo_type = 'keyframed' and frame is not null)
  )
);

create table if not exists public.project_settings (
  project_id uuid primary key references public.projects (id) on delete cascade,
  input_mode text not null default 'hybrid' check (input_mode in ('text', 'mic', 'hybrid')),
  selected_audio_input_device_id text,
  save_raw_audio boolean not null default false,
  last_opened_frame integer not null default 24 check (last_opened_frame between 0 and 100),
  last_selected_thread_id uuid references public.threads (id) on delete set null,
  last_selected_entity_id text,
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists action_families_project_id_idx on public.action_families (project_id);
create index if not exists action_instances_project_id_idx on public.action_instances (project_id);
create index if not exists threads_project_id_idx on public.threads (project_id);
create index if not exists thread_memos_project_id_idx on public.thread_memos (project_id);
create index if not exists thread_memos_thread_id_idx on public.thread_memos (thread_id);

drop trigger if exists set_projects_updated_at on public.projects;
create trigger set_projects_updated_at
before update on public.projects
for each row execute function public.set_updated_at();

drop trigger if exists set_action_families_updated_at on public.action_families;
create trigger set_action_families_updated_at
before update on public.action_families
for each row execute function public.set_updated_at();

drop trigger if exists set_action_instances_updated_at on public.action_instances;
create trigger set_action_instances_updated_at
before update on public.action_instances
for each row execute function public.set_updated_at();

drop trigger if exists set_threads_updated_at on public.threads;
create trigger set_threads_updated_at
before update on public.threads
for each row execute function public.set_updated_at();

drop trigger if exists set_thread_memos_updated_at on public.thread_memos;
create trigger set_thread_memos_updated_at
before update on public.thread_memos
for each row execute function public.set_updated_at();

drop trigger if exists set_project_settings_updated_at on public.project_settings;
create trigger set_project_settings_updated_at
before update on public.project_settings
for each row execute function public.set_updated_at();

alter table public.projects enable row level security;
alter table public.action_families enable row level security;
alter table public.action_instances enable row level security;
alter table public.threads enable row level security;
alter table public.thread_memos enable row level security;
alter table public.project_settings enable row level security;

drop policy if exists projects_owner_all on public.projects;
create policy projects_owner_all
on public.projects
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists action_families_project_owner_all on public.action_families;
create policy action_families_project_owner_all
on public.action_families
for all
using (
  exists (
    select 1
    from public.projects
    where projects.id = action_families.project_id
      and projects.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.projects
    where projects.id = action_families.project_id
      and projects.user_id = auth.uid()
  )
);

drop policy if exists action_instances_project_owner_all on public.action_instances;
create policy action_instances_project_owner_all
on public.action_instances
for all
using (
  exists (
    select 1
    from public.projects
    where projects.id = action_instances.project_id
      and projects.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.projects
    where projects.id = action_instances.project_id
      and projects.user_id = auth.uid()
  )
);

drop policy if exists threads_project_owner_all on public.threads;
create policy threads_project_owner_all
on public.threads
for all
using (
  exists (
    select 1
    from public.projects
    where projects.id = threads.project_id
      and projects.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.projects
    where projects.id = threads.project_id
      and projects.user_id = auth.uid()
  )
);

drop policy if exists thread_memos_project_owner_all on public.thread_memos;
create policy thread_memos_project_owner_all
on public.thread_memos
for all
using (
  exists (
    select 1
    from public.projects
    where projects.id = thread_memos.project_id
      and projects.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.projects
    where projects.id = thread_memos.project_id
      and projects.user_id = auth.uid()
  )
);

drop policy if exists project_settings_owner_all on public.project_settings;
create policy project_settings_owner_all
on public.project_settings
for all
using (
  exists (
    select 1
    from public.projects
    where projects.id = project_settings.project_id
      and projects.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.projects
    where projects.id = project_settings.project_id
      and projects.user_id = auth.uid()
  )
);
