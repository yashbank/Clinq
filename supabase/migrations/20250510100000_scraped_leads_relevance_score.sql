-- Relevance score from deterministic promotion scoring (V2) for review UI and analytics.

alter table public.scraped_leads add column if not exists relevance_score numeric(6, 2);

comment on column public.scraped_leads.relevance_score is
  'Last computed relevance score (0–100) when processed; null if not scored.';

create index if not exists scraped_leads_user_source_created_idx
  on public.scraped_leads (user_id, source, created_at desc);
