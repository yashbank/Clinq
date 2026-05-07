-- Repair Freelancer imports where currency was mis-stored as USD (or missing) but
-- metadata.import.raw_snapshot.currency_id encodes the real marketplace currency (e.g. 11 = INR).
-- Clears mis-copied budget_usd / legacy budget so runtime recomputes from avg + corrected ISO + FX.

UPDATE public.leads AS l
SET
  currency_original = r.iso,
  budget_usd = NULL,
  budget = NULL
FROM (
  SELECT
    id,
    CASE cid
      WHEN 1 THEN 'USD'
      WHEN 2 THEN 'NZD'
      WHEN 3 THEN 'AUD'
      WHEN 4 THEN 'GBP'
      WHEN 5 THEN 'HKD'
      WHEN 6 THEN 'SGD'
      WHEN 8 THEN 'EUR'
      WHEN 9 THEN 'CAD'
      WHEN 11 THEN 'INR'
    END AS iso
  FROM (
    SELECT
      id,
      NULLIF(TRIM(metadata #>> '{import,raw_snapshot,currency_id}'), '')::integer AS cid
    FROM public.leads
    WHERE deleted_at IS NULL
      AND archived_at IS NULL
      AND metadata ? 'import_external_id'
      AND (metadata->>'import_external_id') ILIKE 'freelancer:%'
      AND (metadata #>> '{import,raw_snapshot,currency_id}') ~ '^-?[0-9]+$'
  ) AS q
  WHERE cid IN (1, 2, 3, 4, 5, 6, 8, 9, 11)
) AS r
WHERE l.id = r.id
  AND r.iso IS NOT NULL
  AND r.iso <> 'USD'
  AND (l.currency_original IS NULL OR TRIM(UPPER(l.currency_original)) = 'USD');
