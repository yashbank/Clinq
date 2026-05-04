-- Clinq MVP — apply in Supabase Dashboard → SQL Editor (or Supabase CLI).
-- Idempotent-ish: safe to re-run after manual cleanup of duplicate policies if needed.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- updated_at helper
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- pipeline_stage enum
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.pipeline_stage as enum (
    'saved', 'applied', 'replied', 'interview', 'active', 'completed'
  );
exception
  when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- leads
-- ---------------------------------------------------------------------------
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  client_name text not null,
  platform text,
  project_description text,
  budget numeric(14, 2),
  score int not null default 0 check (score >= 0 and score <= 100),
  stage public.pipeline_stage not null default 'saved',
  email text,
  phone text,
  company text,
  repeat_hire boolean not null default false,
  competition_level int not null default 2 check (competition_level between 1 and 5),
  project_quality int not null default 3 check (project_quality between 1 and 5),
  client_history text,
  proposal_match_notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists leads_set_updated_at on public.leads;
create trigger leads_set_updated_at
  before update on public.leads
  for each row execute function public.set_updated_at();

create index if not exists leads_user_id_idx on public.leads (user_id);
create index if not exists leads_user_stage_idx on public.leads (user_id, stage);
create index if not exists leads_user_score_idx on public.leads (user_id, score desc);

-- ---------------------------------------------------------------------------
-- projects
-- ---------------------------------------------------------------------------
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  lead_id uuid references public.leads (id) on delete set null,
  name text not null,
  description text,
  status text not null default 'active',
  earnings numeric(14, 2) not null default 0,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

create index if not exists projects_user_id_idx on public.projects (user_id);

-- ---------------------------------------------------------------------------
-- proposals
-- ---------------------------------------------------------------------------
create table if not exists public.proposals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  lead_id uuid references public.leads (id) on delete set null,
  title text,
  body text not null,
  mode text not null check (mode in ('short', 'long')),
  tone text not null,
  model text not null default 'gpt-4o-mini',
  created_at timestamptz not null default now()
);

create index if not exists proposals_user_id_idx on public.proposals (user_id);
create index if not exists proposals_lead_id_idx on public.proposals (lead_id);

-- ---------------------------------------------------------------------------
-- activities
-- ---------------------------------------------------------------------------
create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  lead_id uuid references public.leads (id) on delete cascade,
  type text not null,
  description text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists activities_user_id_idx on public.activities (user_id);
create index if not exists activities_lead_id_idx on public.activities (lead_id);

-- ---------------------------------------------------------------------------
-- analytics
-- ---------------------------------------------------------------------------
create table if not exists public.analytics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  metric text not null,
  value numeric,
  dimensions jsonb not null default '{}'::jsonb,
  recorded_at timestamptz not null default now()
);

create index if not exists analytics_user_metric_idx on public.analytics (user_id, metric, recorded_at desc);

-- ---------------------------------------------------------------------------
-- pipelines (board metadata)
-- ---------------------------------------------------------------------------
create table if not exists public.pipelines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null default 'Main board',
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

-- ---------------------------------------------------------------------------
-- New user → profile + default pipeline
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(coalesce(new.email, 'user'), '@', 1))
  )
  on conflict (id) do nothing;

  insert into public.pipelines (user_id, name)
  values (new.id, 'Main board')
  on conflict (user_id, name) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.leads enable row level security;
alter table public.projects enable row level security;
alter table public.proposals enable row level security;
alter table public.activities enable row level security;
alter table public.analytics enable row level security;
alter table public.pipelines enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "leads_all_own" on public.leads;
create policy "leads_all_own" on public.leads
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "projects_all_own" on public.projects;
create policy "projects_all_own" on public.projects
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "proposals_all_own" on public.proposals;
create policy "proposals_all_own" on public.proposals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "activities_all_own" on public.activities;
create policy "activities_all_own" on public.activities
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "analytics_all_own" on public.analytics;
create policy "analytics_all_own" on public.analytics
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "pipelines_all_own" on public.pipelines;
create policy "pipelines_all_own" on public.pipelines
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
