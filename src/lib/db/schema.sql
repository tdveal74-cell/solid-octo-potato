-- ═══════════════════════════════════════════════════════════════════════
-- THE QUIET OPERATOR — Postgres / Supabase schema
-- Requires: Postgres 15+, pgvector extension
-- Apply with: psql "$DATABASE_URL" -f src/lib/db/schema.sql
-- ═══════════════════════════════════════════════════════════════════════

create extension if not exists vector;
create extension if not exists pgcrypto;

-- ── Identity & organizations ────────────────────────────────────────────

create table if not exists organizations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  plan        text not null default 'enterprise-trial',
  created_at  timestamptz not null default now()
);

create table if not exists profiles (
  -- On Supabase, id mirrors auth.users.id
  id            uuid primary key,
  email         text unique not null,
  display_name  text,
  role_title    text,
  industry      text,
  org_id        uuid references organizations(id) on delete set null,
  org_role      text check (org_role in ('owner','admin','member')) ,
  created_at    timestamptz not null default now()
);

-- ── Subscriptions & billing (Stripe) ────────────────────────────────────

create table if not exists subscriptions (
  id                     uuid primary key default gen_random_uuid(),
  profile_id             uuid references profiles(id) on delete cascade,
  org_id                 uuid references organizations(id) on delete cascade,
  stripe_customer_id     text,
  stripe_subscription_id text unique,
  tier                   text not null check (tier in ('operator','operator-pro','enterprise')),
  status                 text not null default 'trialing',
  current_period_end     timestamptz,
  created_at             timestamptz not null default now(),
  check (profile_id is not null or org_id is not null)
);

-- ── Career intelligence ─────────────────────────────────────────────────

create table if not exists job_security_audits (
  id             uuid primary key default gen_random_uuid(),
  profile_id     uuid not null references profiles(id) on delete cascade,
  role_title     text not null,
  industry       text,
  tasks          jsonb not null,           -- TaskInput[] as submitted
  result         jsonb not null,           -- AuditResult from the scoring engine
  exposure_score numeric(5,1) not null,
  band           text not null check (band in ('low','moderate','elevated','high')),
  created_at     timestamptz not null default now()
);

create table if not exists career_roadmaps (
  id          uuid primary key default gen_random_uuid(),
  audit_id    uuid not null references job_security_audits(id) on delete cascade,
  profile_id  uuid not null references profiles(id) on delete cascade,
  roadmap     jsonb not null,              -- CareerRoadmap
  created_at  timestamptz not null default now()
);

-- ── Council deliberations ───────────────────────────────────────────────

create table if not exists deliberations (
  id              uuid primary key default gen_random_uuid(),
  profile_id      uuid references profiles(id) on delete set null,
  org_id          uuid references organizations(id) on delete set null,
  question        text not null,
  result          jsonb not null,          -- DeliberationResult
  consensus_score numeric(5,1) not null,
  decision        text not null,
  elapsed_ms      integer not null,
  created_at      timestamptz not null default now()
);

-- ── Agent runs & memory ─────────────────────────────────────────────────

create table if not exists agent_runs (
  id           uuid primary key default gen_random_uuid(),
  profile_id   uuid references profiles(id) on delete set null,
  agent_id     text not null,
  input        text not null,
  output       text not null,
  route_method text,
  council_id   uuid references deliberations(id) on delete set null,
  created_at   timestamptz not null default now()
);

create table if not exists user_memories (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references profiles(id) on delete cascade,
  content     text not null,
  category    text not null default 'general',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ── Knowledge engine (RAG) ──────────────────────────────────────────────

create table if not exists knowledge_documents (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid references profiles(id) on delete cascade,
  org_id      uuid references organizations(id) on delete cascade,
  title       text not null,
  source      text not null,
  grade       text not null default 'unverified' check (grade in ('primary','secondary','unverified')),
  created_at  timestamptz not null default now()
);

create table if not exists knowledge_chunks (
  id          uuid primary key default gen_random_uuid(),
  document_id uuid not null references knowledge_documents(id) on delete cascade,
  chunk_index integer not null,
  content     text not null,
  embedding   vector(1536),
  unique (document_id, chunk_index)
);

create index if not exists knowledge_chunks_embedding_idx
  on knowledge_chunks using hnsw (embedding vector_cosine_ops);

create or replace function match_chunks(
  query_embedding vector(1536),
  match_count int default 8,
  filter_owner uuid default null
)
returns table (
  chunk_id uuid,
  document_id uuid,
  content text,
  similarity float
)
language sql stable as $$
  select
    kc.id,
    kc.document_id,
    kc.content,
    1 - (kc.embedding <=> query_embedding) as similarity
  from knowledge_chunks kc
  join knowledge_documents kd on kd.id = kc.document_id
  where filter_owner is null or kd.owner_id = filter_owner
  order by kc.embedding <=> query_embedding
  limit match_count
$$;

-- ── Content operating system ────────────────────────────────────────────

create table if not exists content_pieces (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references profiles(id) on delete cascade,
  kind        text not null check (kind in ('newsletter','youtube-script','short-script','social-post','article')),
  title       text not null,
  body        text not null,
  status      text not null default 'draft' check (status in ('draft','reviewed','scheduled','published')),
  scheduled_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ── Security: audit log ─────────────────────────────────────────────────

create table if not exists audit_log (
  id          bigint generated always as identity primary key,
  actor_id    uuid,
  org_id      uuid,
  action      text not null,
  target      text,
  detail      jsonb,
  created_at  timestamptz not null default now()
);

-- ── Row-level security (Supabase) ───────────────────────────────────────

alter table profiles            enable row level security;
alter table subscriptions       enable row level security;
alter table job_security_audits enable row level security;
alter table career_roadmaps     enable row level security;
alter table deliberations       enable row level security;
alter table agent_runs          enable row level security;
alter table user_memories       enable row level security;
alter table knowledge_documents enable row level security;
alter table knowledge_chunks    enable row level security;
alter table content_pieces      enable row level security;

-- Owner-only baseline policies (Supabase auth.uid()); extend per-org as needed.
do $$
begin
  if exists (select 1 from pg_namespace where nspname = 'auth') then
    execute $p$ create policy "own profile"  on profiles            for all using (id = auth.uid()) $p$;
    execute $p$ create policy "own audits"   on job_security_audits for all using (profile_id = auth.uid()) $p$;
    execute $p$ create policy "own roadmaps" on career_roadmaps     for all using (profile_id = auth.uid()) $p$;
    execute $p$ create policy "own runs"     on agent_runs          for all using (profile_id = auth.uid()) $p$;
    execute $p$ create policy "own memory"   on user_memories       for all using (profile_id = auth.uid()) $p$;
    execute $p$ create policy "own docs"     on knowledge_documents for all using (owner_id = auth.uid()) $p$;
    -- Chunks inherit access from their parent document so match_chunks()
    -- works under normal anon/auth roles, not just service-role RPCs.
    execute $p$ create policy "own chunks"   on knowledge_chunks    for all using (
      exists (
        select 1 from knowledge_documents kd
        where kd.id = knowledge_chunks.document_id and kd.owner_id = auth.uid()
      )
    ) $p$;
    execute $p$ create policy "own content"  on content_pieces      for all using (profile_id = auth.uid()) $p$;
  end if;
exception when duplicate_object then null;
end $$;
