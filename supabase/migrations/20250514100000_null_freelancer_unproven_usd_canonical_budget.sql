-- Second-pass cleanup: Freelancer imports still labeled USD with large averages but no API proof (currency_id=1)
-- in raw_snapshot cannot keep numeric canonical budget — clear so UI stays "Budget unavailable" / LOW trust.

UPDATE public.leads
SET
  budget_usd = NULL,
  budget = NULL
WHERE deleted_at IS NULL
  AND archived_at IS NULL
  AND (metadata->>'import_external_id') ILIKE 'freelancer:%'
  AND TRIM(UPPER(COALESCE(currency_original, ''))) = 'USD'
  AND budget_avg IS NOT NULL
  AND budget_avg >= 100000
  AND (
    (metadata #>> '{import,raw_snapshot,currency_id}') IS NULL
    OR TRIM(metadata #>> '{import,raw_snapshot,currency_id}') = ''
    OR NULLIF(TRIM(metadata #>> '{import,raw_snapshot,currency_id}'), '')::integer IS DISTINCT FROM 1
  );
