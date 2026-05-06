-- Soft-dismiss scraped review rows so they leave the default queue without deleting history.

alter table public.scraped_leads add column if not exists dismissed_at timestamptz;

comment on column public.scraped_leads.dismissed_at is
  'When set, row is hidden from the default review queue; ingestion may stage the listing again if allowed by dedupe rules.';

create index if not exists scraped_leads_user_dismissed_idx
  on public.scraped_leads (user_id, dismissed_at)
  where dismissed_at is not null;

create index if not exists scraped_leads_user_queue_idx
  on public.scraped_leads (user_id, created_at desc)
  where dismissed_at is null;
