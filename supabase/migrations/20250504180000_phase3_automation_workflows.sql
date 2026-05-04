-- Phase 3: user-defined automation workflow definitions (no execution engine yet).

create table if not exists public.automation_workflows (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  workflow_type text not null check (workflow_type in ('follow_up_reminder', 'proposal_reminder', 'lead_priority')),
  enabled boolean not null default true,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists automation_workflows_set_updated_at on public.automation_workflows;
create trigger automation_workflows_set_updated_at
  before update on public.automation_workflows
  for each row execute function public.set_updated_at();

create index if not exists automation_workflows_user_idx on public.automation_workflows (user_id, created_at desc);

alter table public.automation_workflows enable row level security;

drop policy if exists "automation_workflows_all_own" on public.automation_workflows;
create policy "automation_workflows_all_own" on public.automation_workflows
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
