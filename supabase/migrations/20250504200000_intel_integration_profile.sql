-- Real data + intelligence phase: integration sync architecture, profile intelligence,
-- proposal evaluations, structured lead intelligence, extraction audit trail.
-- No OAuth secrets stored here — see column comments.

-- ---------------------------------------------------------------------------
-- integration_accounts: sync + credential structure (values optional / empty)
-- ---------------------------------------------------------------------------
alter table public.integration_accounts
  add column if not exists sync_status text not null default 'idle'
    check (sync_status in ('idle', 'queued', 'running', 'succeeded', 'failed'));

alter table public.integration_accounts
  add column if not exists last_sync_at timestamptz;

alter table public.integration_accounts
  add column if not exists import_stats jsonb not null default '{}'::jsonb;

alter table public.integration_accounts
  add column if not exists credentials jsonb not null default '{}'::jsonb;

comment on column public.integration_accounts.credentials is
  'Non-secret metadata only until a vault exists (e.g. external_account_id, token_vault_key). Never store raw OAuth tokens in this column.';
comment on column public.integration_accounts.sync_status is
  'Last sync attempt lifecycle for ingestion jobs; distinct from connection status.';
comment on column public.integration_accounts.import_stats is
  'Opaque counters from last successful sync, e.g. {"leadsImported":0,"jobsSeen":0}.';

create index if not exists integration_accounts_sync_idx
  on public.integration_accounts (user_id, sync_status);

-- ---------------------------------------------------------------------------
-- integration_sync_jobs: queue / orchestration (DB-backed)
-- ---------------------------------------------------------------------------
create table if not exists public.integration_sync_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  provider text not null check (provider in ('freelancer', 'upwork', 'fiverr', 'contra')),
  job_type text not null check (job_type in ('full_sync', 'profile', 'jobs_delta', 'leads_delta')),
  status text not null default 'queued' check (status in ('queued', 'running', 'succeeded', 'failed', 'cancelled')),
  payload jsonb not null default '{}'::jsonb,
  result jsonb,
  error text,
  scheduled_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists integration_sync_jobs_user_scheduled_idx
  on public.integration_sync_jobs (user_id, scheduled_at desc);

alter table public.integration_sync_jobs enable row level security;

drop policy if exists "integration_sync_jobs_select_own" on public.integration_sync_jobs;
create policy "integration_sync_jobs_select_own" on public.integration_sync_jobs
  for select using (auth.uid() = user_id);

drop policy if exists "integration_sync_jobs_insert_own" on public.integration_sync_jobs;
create policy "integration_sync_jobs_insert_own" on public.integration_sync_jobs
  for insert with check (auth.uid() = user_id);

drop policy if exists "integration_sync_jobs_update_own" on public.integration_sync_jobs;
create policy "integration_sync_jobs_update_own" on public.integration_sync_jobs
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- profiles: bio, website, machine-readable intelligence blob
-- ---------------------------------------------------------------------------
alter table public.profiles add column if not exists bio text;
alter table public.profiles add column if not exists website_url text;
alter table public.profiles add column if not exists profile_intelligence jsonb not null default '{}'::jsonb;
alter table public.profiles add column if not exists profile_intelligence_updated_at timestamptz;

comment on column public.profiles.profile_intelligence is
  'Structured freelancer intelligence (skills, tone hints, positioning). Populated by app engine; not user-edited JSON.';

-- ---------------------------------------------------------------------------
-- profile_extractions: audit trail for parsing (PDF, URLs, GitHub, etc.)
-- ---------------------------------------------------------------------------
create table if not exists public.profile_extractions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  source_type text not null check (source_type in (
    'resume_pdf', 'resume_text', 'url', 'github_public', 'linkedin_placeholder', 'portfolio_url'
  )),
  source_summary text,
  extracted jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists profile_extractions_user_idx on public.profile_extractions (user_id, created_at desc);

alter table public.profile_extractions enable row level security;

drop policy if exists "profile_extractions_select_own" on public.profile_extractions;
create policy "profile_extractions_select_own" on public.profile_extractions
  for select using (auth.uid() = user_id);

drop policy if exists "profile_extractions_insert_own" on public.profile_extractions;
create policy "profile_extractions_insert_own" on public.profile_extractions
  for insert with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- proposals: optional post-generation evaluation (JSON)
-- ---------------------------------------------------------------------------
alter table public.proposals add column if not exists evaluation jsonb;

comment on column public.proposals.evaluation is
  'Proposal quality evaluation dimensions + model id + created timestamp; written after generation when AI is configured.';

-- ---------------------------------------------------------------------------
-- leads: structured intelligence (separate from client metadata json)
-- ---------------------------------------------------------------------------
alter table public.leads add column if not exists intelligence jsonb not null default '{}'::jsonb;

comment on column public.leads.intelligence is
  'Explainable lead intelligence pipeline output (versioned object). UI may also mirror key fields into metadata for backward compatibility.';
