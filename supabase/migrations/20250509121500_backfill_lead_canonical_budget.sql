-- Backfill canonical budget columns from import metadata and legacy `budget` (USD) where safe.
-- Run via Supabase migrations or SQL editor after deploy.

-- 1) Copy min / max / currency from nested import metadata when columns are empty.
update public.leads l
set
  budget_min = coalesce(l.budget_min, (l.metadata->'import'->'budget_min')::numeric),
  budget_max = coalesce(l.budget_max, (l.metadata->'import'->'budget_max')::numeric),
  currency_original = coalesce(
    nullif(trim(l.currency_original), ''),
    nullif(upper(trim(l.metadata->'import'->>'currency_code')), '')
  )
where l.deleted_at is null;

-- 2) Derive budget_avg from min/max when still null.
update public.leads l
set budget_avg = coalesce(
  l.budget_avg,
  case
    when l.budget_min is not null and l.budget_max is not null
      then round((l.budget_min + l.budget_max) / 2::numeric, 2)
    when l.budget_min is not null then l.budget_min
    when l.budget_max is not null then l.budget_max
    else null
  end
)
where l.deleted_at is null
  and l.budget_avg is null
  and (l.budget_min is not null or l.budget_max is not null);

-- 3) When budget_usd is still null but legacy `budget` exists and currency is unknown or USD, treat `budget` as USD (historical Clinq behavior).
update public.leads l
set
  budget_usd = round(l.budget::numeric, 2),
  currency_original = coalesce(nullif(trim(l.currency_original), ''), 'USD'),
  budget_avg = coalesce(l.budget_avg, round(l.budget::numeric, 2))
where l.deleted_at is null
  and l.budget is not null
  and l.budget > 0
  and l.budget_usd is null
  and (
    l.currency_original is null
    or trim(l.currency_original) = ''
    or upper(trim(l.currency_original)) = 'USD'
  )
  and (
    l.metadata->'import'->>'currency_code' is null
    or upper(trim(l.metadata->'import'->>'currency_code')) = 'USD'
  );
