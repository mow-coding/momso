-- momso AI Wiki — 고객 Supabase 데이터 스키마(BYO 데이터 분리, 알파)
-- 이 SQL을 "본인" Supabase 프로젝트의 SQL 에디터에 한 번 붙여넣어 실행하세요.
-- 실행하면 데이터 테이블(objet / zet / zet_link / zet_edge / entity / entity_alias / embedding)이
-- 본인 Supabase에 생성됩니다. 이후 몸소 설정에서 "내 Supabase 연결"을 누르면 데이터가 여기에 저장됩니다.
--
-- 중앙(momso-alpha)과의 차이(정직):
--   - 고객 Supabase에는 momso 중앙의 auth.users가 없습니다. 따라서 owner는 auth.users 외래키가
--     아니라 평문 uuid 컬럼입니다(momso 서버가 호출자 정체를 검증해 owner를 코드로 강제 주입).
--   - 데이터 접근은 momso 서버 라우트가 service-role 키로 대리 수행합니다(키는 브라우저에 노출 금지).
--   - 임베딩 차원은 중앙과 동일한 vector(1024).
--
-- 전진형·idempotent: 여러 번 실행해도 안전합니다(create if not exists).

-- pgvector(임베딩 KNN)
create extension if not exists "vector";

-- ── 업로드 원본 (objet) ──────────────────────────────────────
create table if not exists public.objet (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null,                 -- momso 서버가 검증·강제 주입(고객 DB엔 auth.users 없음)
  workspace_id uuid,
  kind text not null,
  title text not null,
  body text,
  file_name text,
  storage_path text,
  created_at timestamptz not null default now()
);
create index if not exists objet_owner_idx on public.objet (owner);
create index if not exists objet_workspace_idx on public.objet (workspace_id);

-- ── 검수·발행된 리포트 (zet) ─────────────────────────────────
create table if not exists public.zet (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null,
  workspace_id uuid,
  title text not null,
  body text not null default '',
  status text not null default 'draft' check (status in ('draft', 'published')),
  source text not null check (source in ('class', 'chat')),
  objet_id uuid references public.objet (id) on delete set null,
  corrected_id uuid,                   -- 발행 계보(어느 보정본 L2에서 나왔나)
  source_refs jsonb not null default '[]', -- 구조화 출처(주장별 근거 스팬)
  created_at timestamptz not null default now(),
  published_at timestamptz
);
create index if not exists zet_owner_idx on public.zet (owner);
create index if not exists zet_workspace_idx on public.zet (workspace_id);

-- ── zet 귀속 링크 (수업/수련생, 0..N) ────────────────────────
create table if not exists public.zet_link (
  id uuid primary key default gen_random_uuid(),
  zet_id uuid not null references public.zet (id) on delete cascade,
  target_type text not null check (target_type in ('class', 'student')),
  target_ref text not null
);
create index if not exists zet_link_zet_idx on public.zet_link (zet_id);

-- ── 타입드 리포트↔리포트 엣지 (관계 그래프) ───────────────────
create table if not exists public.zet_edge (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null,
  workspace_id uuid,
  from_zet uuid not null references public.zet (id) on delete cascade,
  to_zet uuid not null references public.zet (id) on delete cascade,
  kind text not null check (kind in ('supersedes', 'related', 'contraindication', 'longitudinal')),
  note text,
  created_at timestamptz not null default now(),
  constraint zet_edge_no_self check (from_zet <> to_zet),
  constraint zet_edge_uniq unique (owner, from_zet, to_zet, kind)
);
create index if not exists zet_edge_from_idx on public.zet_edge (from_zet);
create index if not exists zet_edge_to_idx on public.zet_edge (to_zet);
create index if not exists zet_edge_workspace_idx on public.zet_edge (workspace_id);

-- ── 몸소 딕셔너리: entity(화자/용어) + entity_alias(별칭) ──────
create table if not exists public.entity (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null,
  workspace_id uuid,
  kind text not null check (kind in ('speaker', 'term')),
  canonical text not null,
  note text,
  confirmed boolean not null default false, -- 화자 정체=사람 확인된 것만 유효(자동단정 금지)
  meta jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create table if not exists public.entity_alias (
  id uuid primary key default gen_random_uuid(),
  entity_id uuid not null references public.entity (id) on delete cascade,
  alias text not null
);
create index if not exists entity_owner_idx on public.entity (owner);
create index if not exists entity_workspace_idx on public.entity (workspace_id);
create index if not exists entity_kind_idx on public.entity (kind);
create index if not exists entity_alias_entity_idx on public.entity_alias (entity_id);

-- ── 보정본(L2) 영속 + 보정추적 (§4 provenance) ───────────────
create table if not exists public.corrected_transcript (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null,
  workspace_id uuid,
  objet_id uuid not null references public.objet (id) on delete cascade,
  corrected_body text not null,
  speaker_map jsonb not null default '[]',
  terms jsonb not null default '[]',
  created_at timestamptz not null default now()
);
create index if not exists corrected_objet_idx on public.corrected_transcript (objet_id);

create table if not exists public.correction_log (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null,
  workspace_id uuid,
  objet_id uuid references public.objet (id) on delete cascade,
  corrected_id uuid references public.corrected_transcript (id) on delete cascade,
  kind text not null check (kind in ('term', 'speaker')),
  from_value text,
  to_value text,
  created_at timestamptz not null default now()
);
create index if not exists correction_log_objet_idx on public.correction_log (objet_id);

-- ── RAG 임베딩 (objet/zet 청크) — 중앙과 동일 차원 vector(1024) ──
create table if not exists public.embedding (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null,
  workspace_id uuid,
  source_type text not null check (source_type in ('objet', 'zet')),
  source_id uuid not null,
  content text not null,
  chunk_index int not null default 0,
  model_id text,                       -- 어느 임베딩 모델로 만든 벡터인지('단일 활성 모델' 추적)
  dim int,                             -- 임베딩 차원
  embedding vector (1024),
  created_at timestamptz not null default now()
);
-- 정확 KNN(인덱스 없이 seq scan + 코사인). 알파 소규모(~1000청크)에선 근사 ivfflat의 리콜 손실
--   (금기/안전 신호 누락 위험)보다 정확 KNN이 안전·단순 — design doc §8.
create index if not exists embedding_owner_idx on public.embedding (owner);
create index if not exists embedding_workspace_idx on public.embedding (workspace_id);
create index if not exists embedding_source_idx on public.embedding (source_type, source_id);

-- ── RLS ──────────────────────────────────────────────────────
-- momso 서버는 service-role 키로 접근(RLS 우회)하고 owner 스코프를 코드로 강제한다.
-- 그래도 RLS는 켜둔다: 혹시 anon/authenticated 경로가 열려도 기본 차단(심층 방어).
alter table public.objet enable row level security;
alter table public.zet enable row level security;
alter table public.zet_link enable row level security;
alter table public.zet_edge enable row level security;
alter table public.entity enable row level security;
alter table public.entity_alias enable row level security;
alter table public.embedding enable row level security;
alter table public.corrected_transcript enable row level security;
alter table public.correction_log enable row level security;

-- ── RAG 검색 RPC: 워크스페이스 스코프 KNN ─────────────────────
-- service-role(서버 프록시) 호출 전용 — owner/ws를 인자로 받아 명시적으로 스코프한다.
--   (중앙의 match_embedding은 security invoker + auth.uid()였으나, 고객 DB엔 auth 세션이
--    없으므로 owner를 인자로 받는 형태로 둔다. 서버가 검증한 owner만 전달.)
create or replace function public.match_embedding (
  query_embedding vector (1024),
  ws uuid,
  owner_id uuid,
  match_count int
)
returns table (
  source_type text,
  source_id uuid,
  content text,
  similarity float
)
language sql
stable
set search_path = public
as $$
  select
    e.source_type,
    e.source_id,
    e.content,
    1 - (e.embedding <=> query_embedding) as similarity
  from public.embedding e
  where e.owner = owner_id
    and e.workspace_id = ws
    and e.embedding is not null
  order by e.embedding <=> query_embedding asc
  limit match_count;
$$;

-- 어휘 검색(RRF 융합용) — 'simple' FTS. 서버 프록시가 검증한 owner만 전달.
create index if not exists embedding_fts_idx
  on public.embedding using gin (to_tsvector('simple', content));

create or replace function public.lexical_match (
  q text,
  ws uuid,
  owner_id uuid,
  match_count int
)
returns table (
  source_type text,
  source_id uuid,
  content text,
  score float
)
language sql
stable
set search_path = public
as $$
  select
    e.source_type,
    e.source_id,
    e.content,
    ts_rank(to_tsvector('simple', e.content), websearch_to_tsquery('simple', q)) as score
  from public.embedding e
  where e.owner = owner_id
    and e.workspace_id = ws
    and to_tsvector('simple', e.content) @@ websearch_to_tsquery('simple', q)
  order by score desc
  limit match_count;
$$;

-- 적용은 여기까지입니다. 이 SQL을 한 번 실행한 뒤 몸소 설정에서 "내 Supabase 연결"을 누르면,
-- 몸소 서버가 이 테이블들의 존재를 확인하고 데이터를 본인 Supabase에 저장하기 시작합니다.
-- (몸소는 고객 DB에 임의 DDL을 자동 실행하지 않습니다 — 스키마 적용은 본인이 직접 합니다.)
