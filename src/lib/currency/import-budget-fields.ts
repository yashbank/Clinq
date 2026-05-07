import { freelancerCurrencyIdToIso } from "@/lib/integrations/freelancer/freelancer-currency-ids";

function parseCurrencyIdField(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return Math.trunc(v);
  if (typeof v === "string" && /^\s*\d+\s*$/.test(v)) return Math.trunc(Number(v.trim()));
  return null;
}

/**
 * Pure extraction of Freelancer (and similar) import budget fields from `metadata.import`
 * plus `raw_snapshot` when top-level `currency_code` is missing.
 * Also maps `currency_id` (Freelancer API) to ISO when present on import or snapshot.
 */
export function extractImportBudgetFields(metadataExtra: Record<string, unknown> | undefined): {
  min: number | null;
  max: number | null;
  currency: string | null;
} {
  if (!metadataExtra || typeof metadataExtra !== "object") {
    return { min: null, max: null, currency: null };
  }
  const imp = metadataExtra.import;
  if (!imp || typeof imp !== "object" || Array.isArray(imp)) {
    return { min: null, max: null, currency: null };
  }
  const r = imp as Record<string, unknown>;
  const min = typeof r.budget_min === "number" && Number.isFinite(r.budget_min) ? r.budget_min : null;
  const max = typeof r.budget_max === "number" && Number.isFinite(r.budget_max) ? r.budget_max : null;

  const raw = r.raw_snapshot;
  const snap = raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : null;

  const codeSnap =
    snap && typeof snap.currency_code === "string" && snap.currency_code.trim()
      ? snap.currency_code.trim().toUpperCase()
      : "";
  const idSnapIso = freelancerCurrencyIdToIso(parseCurrencyIdField(snap?.currency_id));

  const top = typeof r.currency_code === "string" && r.currency_code.trim() ? r.currency_code.trim().toUpperCase() : "";
  const idImpIso = freelancerCurrencyIdToIso(parseCurrencyIdField(r.currency_id));

  /**
   * Prefer mapped `currency_id` (API truth) over string codes.
   * Among strings, prefer explicit `import.currency_code` over `raw_snapshot.currency_code` (stale snapshot text).
   */
  const currency =
    idSnapIso ??
    idImpIso ??
    (top.length === 3 ? top : null) ??
    (codeSnap.length === 3 ? codeSnap : null) ??
    null;

  return { min, max, currency };
}
