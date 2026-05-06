/**
 * Pure extraction of Freelancer (and similar) import budget fields from `metadata.import`
 * plus `raw_snapshot` when the top-level `currency_code` is missing.
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

  const top = typeof r.currency_code === "string" && r.currency_code.trim() ? r.currency_code.trim().toUpperCase() : "";

  const raw = r.raw_snapshot;
  const snap = raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : null;
  const fromSnap =
    snap && typeof snap.currency_code === "string" && snap.currency_code.trim()
      ? snap.currency_code.trim().toUpperCase()
      : "";

  const merged = top || fromSnap;
  const currency = merged.length === 3 ? merged : null;

  return { min, max, currency };
}
