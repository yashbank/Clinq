-- Repair leads where budget_usd was incorrectly set equal to budget_avg in a non-USD currency
-- (historical insert path treated marketplace average as USD). Clear so runtime + backfill logic
-- recomputes from budget_avg + currency_original + FX.

update public.leads l
set
  budget_usd = null,
  budget = null
where l.deleted_at is null
  and l.currency_original is not null
  and upper(trim(l.currency_original)) <> 'USD'
  and l.budget_avg is not null
  and l.budget_avg > 0
  and l.budget_usd is not null
  and abs(l.budget_usd - l.budget_avg) < 0.05;
