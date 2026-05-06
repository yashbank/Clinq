-- Scraped leads staging + lead short description + import dedupe + cleanup helper.

-- ---------------------------------------------------------------------------
-- scraped_leads: raw marketplace rows before promotion into leads
-- ---------------------------------------------------------------------------
create table if not exists public.scraped_leads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  raw_data jsonb not null default '{}'::jsonb,
  source text not null,
  created_at timestamptz not null default now(),
  processed boolean not null default false
);

create index if not exists scraped_leads_user_processed_idx on public.scraped_leads (user_id, processed);
create index if not exists scraped_leads_created_at_idx on public.scraped_leads (created_at desc);

comment on table public.scraped_leads is
  'Staging for imported marketplace projects; processed rows are either promoted to leads or skipped.';

alter table public.scraped_leads enable row level security;

drop policy if exists "scraped_leads_select_own" on public.scraped_leads;
create policy "scraped_leads_select_own" on public.scraped_leads
  for select using (auth.uid() = user_id);

drop policy if exists "scraped_leads_insert_own" on public.scraped_leads;
create policy "scraped_leads_insert_own" on public.scraped_leads
  for insert with check (auth.uid() = user_id);

drop policy if exists "scraped_leads_update_own" on public.scraped_leads;
create policy "scraped_leads_update_own" on public.scraped_leads
  for update using (auth.uid() = user_id);

drop policy if exists "scraped_leads_delete_own" on public.scraped_leads;
create policy "scraped_leads_delete_own" on public.scraped_leads
  for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- leads: cached short blurb (extractive / generated once)
-- ---------------------------------------------------------------------------
alter table public.leads add column if not exists short_description text;

comment on column public.leads.short_description is
  'One–two line summary of the opportunity; filled on insert to avoid repeat work.';

-- ---------------------------------------------------------------------------
-- Import dedupe: existing lead OR pending scraped row (same external id)
-- ---------------------------------------------------------------------------
create or replace function public.lead_import_ext_ids_existing(p_ext_ids text[])
returns text[]
language sql
stable
security invoker
set search_path = public
as $$
  select coalesce(array_agg(distinct ext), '{}'::text[])
  from (
    select metadata->>'import_external_id' as ext
    from public.leads
    where user_id = auth.uid()
      and deleted_at is null
      and archived_at is null
      and metadata ? 'import_external_id'
      and (metadata->>'import_external_id') = any (p_ext_ids)
    union
    select raw_data->>'import_external_id' as ext
    from public.scraped_leads
    where user_id = auth.uid()
      and processed = false
      and raw_data ? 'import_external_id'
      and (raw_data->>'import_external_id') = any (p_ext_ids)
  ) t
  where ext is not null and ext <> '';
$$;

comment on function public.lead_import_ext_ids_existing(text[]) is
  'Returns import_external_id values already present on active leads or on unprocessed scraped rows.';

-- ---------------------------------------------------------------------------
-- Housekeeping (schedule via Supabase cron / Edge: daily recommended)
-- ---------------------------------------------------------------------------
create or replace function public.cleanup_scraped_leads_older_than_7d()
returns integer
language sql
security definer
set search_path = public
as $$
  with d as (
    delete from public.scraped_leads
    where created_at < (now() - interval '7 days')
    returning 1
  )
  select count(*)::int from d;
$$;

revoke all on function public.cleanup_scraped_leads_older_than_7d() from public;
grant execute on function public.cleanup_scraped_leads_older_than_7d() to service_role;

comment on function public.cleanup_scraped_leads_older_than_7d() is
  'Deletes scraped_leads older than 7 days. Run from Supabase Scheduled Triggers (service role).';
