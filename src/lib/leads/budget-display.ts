export type BudgetType = "fixed" | "hourly" | "unknown";

export type LeadBudgetDisplay = {
  /** Human-readable budget line, or empty when nothing to show. */
  label: string;
  kind: BudgetType;
  /** When true, omit budget UI entirely. */
  hide: boolean;
};

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return `${Math.round(n)}`;
}

/**
 * Reads `metadata.import` budget fields set by Freelancer normalize.
 */
export function leadBudgetDisplayFromMetadata(metadata: Record<string, unknown> | null | undefined): LeadBudgetDisplay {
  const meta = metadata && typeof metadata === "object" ? metadata : {};
  const imp = meta.import && typeof meta.import === "object" && !Array.isArray(meta.import) ? (meta.import as Record<string, unknown>) : {};
  const min = typeof imp.budget_min === "number" && Number.isFinite(imp.budget_min) ? imp.budget_min : null;
  const max = typeof imp.budget_max === "number" && Number.isFinite(imp.budget_max) ? imp.budget_max : null;
  const cur = typeof imp.currency_code === "string" && imp.currency_code.trim() ? imp.currency_code.trim().toUpperCase() : "";
  const prefix = cur ? `${cur} ` : "";

  const btRaw = typeof imp.budget_type === "string" ? imp.budget_type.toLowerCase() : "";
  const kind: BudgetType = btRaw === "hourly" ? "hourly" : btRaw === "fixed" ? "fixed" : "unknown";

  if (min != null && max != null && min !== max) {
    return { label: `${prefix}${fmt(min)} – ${fmt(max)}`, kind, hide: false };
  }
  if (min != null) {
    return { label: `${prefix}${fmt(min)}`, kind, hide: false };
  }
  if (max != null) {
    return { label: `${prefix}${fmt(max)}`, kind, hide: false };
  }

  return { label: "", kind, hide: true };
}

/** Legacy: single `budget` on row with no import detail — show amount only. */
export function leadBudgetFallback(amount: number | null | undefined, platform: string | null | undefined): LeadBudgetDisplay {
  const n = Number(amount);
  if (!amount || Number.isNaN(n) || n <= 0) return { label: "", kind: "unknown", hide: true };
  const p = (platform ?? "").toLowerCase();
  const kind: BudgetType = p.includes("hour") ? "hourly" : "fixed";
  return { label: `$${fmt(n)}`, kind, hide: false };
}
