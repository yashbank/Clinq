-- Phase 2: freelancer profile enrichment + integration link placeholders (no scraping).

-- ---------------------------------------------------------------------------
-- profiles: professional context for AI proposals & lead workflow
-- ---------------------------------------------------------------------------
alter table public.profiles add column if not exists resume_text text;
alter table public.profiles add column if not exists resume_filename text;
alter table public.profiles add column if not exists skills text[] not null default '{}'::text[];
alter table public.profiles add column if not exists tech_stack text[] not null default '{}'::text[];
alter table public.profiles add column if not exists portfolio_links text[] not null default '{}'::text[];
alter table public.profiles add column if not exists linkedin_url text;
alter table public.profiles add column if not exists github_url text;
alter table public.profiles add column if not exists experience_level text;
alter table public.profiles add column if not exists niches text[] not null default '{}'::text[];
alter table public.profiles add column if not exists profile_onboarding_completed_at timestamptz;

comment on column public.profiles.resume_text is 'Resume or CV text supplied by user (paste or plain-text extract). Not auto-scraped.';
comment on column public.profiles.experience_level is 'Optional: junior | mid | senior | lead — validated in app.';

-- ---------------------------------------------------------------------------
-- integration_accounts: platform link state (simulated OAuth until real modules)
-- ---------------------------------------------------------------------------
create table if not exists public.integration_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  provider text not null check (provider in ('freelancer', 'upwork', 'fiverr', 'contra')),
  status text not null default 'disconnected' check (status in ('disconnected', 'connected')),
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider)
);

drop trigger if exists integration_accounts_set_updated_at on public.integration_accounts;
create trigger integration_accounts_set_updated_at
  before update on public.integration_accounts
  for each row execute function public.set_updated_at();

create index if not exists integration_accounts_user_idx on public.integration_accounts (user_id);

alter table public.integration_accounts enable row level security;

drop policy if exists "integration_accounts_select_own" on public.integration_accounts;
create policy "integration_accounts_select_own" on public.integration_accounts
  for select using (auth.uid() = user_id);

drop policy if exists "integration_accounts_insert_own" on public.integration_accounts;
create policy "integration_accounts_insert_own" on public.integration_accounts
  for insert with check (auth.uid() = user_id);

drop policy if exists "integration_accounts_update_own" on public.integration_accounts;
create policy "integration_accounts_update_own" on public.integration_accounts
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "integration_accounts_delete_own" on public.integration_accounts;
create policy "integration_accounts_delete_own" on public.integration_accounts
  for delete using (auth.uid() = user_id);
