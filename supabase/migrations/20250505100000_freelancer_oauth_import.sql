-- Freelancer.com: OAuth token storage (server-only via service role) + import dedupe helper + job type.

-- ---------------------------------------------------------------------------
-- integration_oauth_tokens: access/refresh tokens (RLS default deny for JWT)
-- ---------------------------------------------------------------------------
create table if not exists public.integration_oauth_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  provider text not null check (provider in ('freelancer')),
  access_token text not null,
  refresh_token text,
  token_expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider)
);

drop trigger if exists integration_oauth_tokens_set_updated_at on public.integration_oauth_tokens;
create trigger integration_oauth_tokens_set_updated_at
  before update on public.integration_oauth_tokens
  for each row execute function public.set_updated_at();

alter table public.integration_oauth_tokens enable row level security;

comment on table public.integration_oauth_tokens is
  'OAuth tokens for marketplace APIs. No RLS policies for authenticated — app reads/writes only with service role after verifying the user.';

-- ---------------------------------------------------------------------------
-- integration_sync_jobs: allow explicit lead_import job type
-- ---------------------------------------------------------------------------
alter table public.integration_sync_jobs drop constraint if exists integration_sync_jobs_job_type_check;
alter table public.integration_sync_jobs
  add constraint integration_sync_jobs_job_type_check
  check (job_type in ('full_sync', 'profile', 'jobs_delta', 'leads_delta', 'lead_import'));

-- ---------------------------------------------------------------------------
-- Dedupe: which external import keys already exist for the current user
-- ---------------------------------------------------------------------------
create or replace function public.lead_import_ext_ids_existing(p_ext_ids text[])
returns text[]
language sql
stable
security invoker
set search_path = public
as $$
  select coalesce(array_agg(distinct metadata->>'import_external_id'), '{}'::text[])
  from public.leads
  where user_id = auth.uid()
    and metadata ? 'import_external_id'
    and (metadata->>'import_external_id') = any(p_ext_ids);
$$;

comment on function public.lead_import_ext_ids_existing(text[]) is
  'Returns import_external_id values from the caller''s leads that match any of p_ext_ids (for import deduplication).';

grant execute on function public.lead_import_ext_ids_existing(text[]) to authenticated;
