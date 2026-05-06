-- Review fields for scraped_leads (import staging): skip reason + short summary for UI.

alter table public.scraped_leads add column if not exists skip_reason text;
alter table public.scraped_leads add column if not exists short_summary text;

comment on column public.scraped_leads.skip_reason is
  'When processed and not promoted: why the row was skipped (e.g. low relevance gates).';
comment on column public.scraped_leads.short_summary is
  'One-line summary for review UI (title or description snippet).';
