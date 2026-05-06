-- Leads: interest, soft delete, archive, similarity demotion for "not interested" signal.

alter table public.leads
  add column if not exists interest_status text null
    check (interest_status is null or interest_status in ('interested', 'not_interested'));

alter table public.leads
  add column if not exists deleted_at timestamptz null;

alter table public.leads
  add column if not exists archived_at timestamptz null;

alter table public.leads
  add column if not exists similarity_demotion int not null default 0
    check (similarity_demotion >= 0 and similarity_demotion <= 50);

do $$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'leads'
      and column_name = 'sort_key'
  ) then
    alter table public.leads
      add column sort_key int generated always as (greatest(0, score - similarity_demotion)) stored;
  end if;
end $$;

-- Denormalized flags for filters (kept in sync by Postgres from metadata/platform).
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'leads' and column_name = 'is_freelancer_channel'
  ) then
    alter table public.leads add column is_freelancer_channel boolean generated always as (
      (coalesce(metadata->>'source', '') = 'freelancer')
      or (lower(coalesce(platform, '')) like '%freelancer%')
    ) stored;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'leads' and column_name = 'is_imported_lead'
  ) then
    alter table public.leads add column is_imported_lead boolean generated always as (
      (metadata ? 'import_external_id')
      and coalesce(metadata->>'import_external_id', '') <> ''
    ) stored;
  end if;
end $$;

create index if not exists leads_user_active_sort_idx
  on public.leads (user_id, sort_key desc)
  where deleted_at is null and archived_at is null;

create index if not exists leads_user_interest_idx
  on public.leads (user_id, interest_status)
  where deleted_at is null and archived_at is null;

comment on column public.leads.interest_status is 'User intent: interested | not_interested | null.';
comment on column public.leads.deleted_at is 'Soft delete — hidden from main lists.';
comment on column public.leads.archived_at is 'Archived — hidden from main list until archive view.';
comment on column public.leads.similarity_demotion is 'Subtracted from score for ordering only (see sort_key); bumped when user marks similar leads not interested.';

-- Tab counts for active (non-deleted, non-archived) leads — caller must be the row owner (RLS).
create or replace function public.lead_tab_counts()
returns table(all_main bigint, imported bigint, manual_n bigint, freelancer_n bigint)
language sql
stable
security invoker
set search_path = public
as $$
  select
    count(*) filter (where deleted_at is null and archived_at is null)::bigint as all_main,
    count(*) filter (
      where deleted_at is null
        and archived_at is null
        and is_imported_lead
    )::bigint as imported,
    count(*) filter (
      where deleted_at is null
        and archived_at is null
        and not is_imported_lead
    )::bigint as manual_n,
    count(*) filter (
      where deleted_at is null
        and archived_at is null
        and is_freelancer_channel
    )::bigint as freelancer_n
  from public.leads
  where user_id = auth.uid();
$$;

grant execute on function public.lead_tab_counts() to authenticated;
