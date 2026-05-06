-- Production: preferred display currency, canonical budget columns on leads, optional scraped promotion audit.

alter table public.profiles
  add column if not exists preferred_currency text not null default 'USD'
    check (preferred_currency in ('USD', 'INR', 'GBP', 'CAD', 'EUR'));

comment on column public.profiles.preferred_currency is
  'User-facing currency for budgets (FX conversion from stored USD amounts).';

alter table public.leads
  add column if not exists budget_min numeric(14, 2),
  add column if not exists budget_max numeric(14, 2),
  add column if not exists budget_avg numeric(14, 2),
  add column if not exists currency_original text,
  add column if not exists budget_usd numeric(14, 2);

comment on column public.leads.budget_min is 'Original marketplace budget lower bound when known.';
comment on column public.leads.budget_max is 'Original marketplace budget upper bound when known.';
comment on column public.leads.budget_avg is 'Average of min/max or single bound in original currency.';
comment on column public.leads.currency_original is 'ISO 4217 code for budget_min/max/avg (e.g. USD, EUR).';
comment on column public.leads.budget_usd is 'budget_avg converted to USD for reporting and FX display.';

create index if not exists leads_user_budget_usd_idx on public.leads (user_id, budget_usd desc nulls last)
  where budget_usd is not null;
