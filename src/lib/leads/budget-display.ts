import { extractImportBudgetFields } from "@/lib/currency/import-budget-fields";

export type BudgetType = "fixed" | "hourly" | "unknown";

export type LeadBudgetDisplay = {
  /** Human-readable budget line, or empty when nothing to show. */
  label: string;
  kind: BudgetType;
  /** When true, omit budget UI entirely. */
  hide: boolean;
};

function fmtCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(0)}k`;
  return `${Math.round(n)}`;
}

function fmtPlain(n: number): string {
  return Math.round(n).toLocaleString("en-US");
}

function inrPlain(n: number): string {
  return Math.round(n).toLocaleString("en-IN");
}

/** USD-style prefix; INR uses ₹ + en-IN grouping. */
function moneyToken(n: number, cur: string): string {
  if (!cur || cur === "USD") return `$${fmtPlain(n)}`;
  if (cur === "INR") return `₹${inrPlain(n)}`;
  return `${cur} ${fmtPlain(n)}`;
}

/**
 * Reads `metadata.import` budget fields set by Freelancer normalize.
 */
export function leadBudgetDisplayFromMetadata(metadata: Record<string, unknown> | null | undefined): LeadBudgetDisplay {
  const meta = (metadata && typeof metadata === "object" ? metadata : {}) as Record<string, unknown>;
  const imp = meta.import && typeof meta.import === "object" && !Array.isArray(meta.import) ? (meta.import as Record<string, unknown>) : {};
  const { min, max, currency: curIso } = extractImportBudgetFields(meta);
  const minN = min;
  const maxN = max;
  const cur = curIso ?? "";

  const btRaw = typeof imp.budget_type === "string" ? imp.budget_type.toLowerCase() : "";
  let kind: BudgetType = btRaw === "hourly" ? "hourly" : btRaw === "fixed" ? "fixed" : "unknown";

  if (minN == null && maxN == null) {
    return { label: "", kind: "unknown", hide: true };
  }

  if (kind === "unknown" && (minN != null || maxN != null)) {
    kind = "fixed";
  }

  if (minN != null && maxN != null && minN === maxN) {
    const token = moneyToken(minN, cur);
    if (kind === "hourly") return { label: `${token}/hr`, kind: "hourly", hide: false };
    return { label: token, kind: "fixed", hide: false };
  }

  if (minN != null && maxN != null && minN !== maxN) {
    const en = "\u2013";
    const label =
      cur === "INR"
        ? `₹${inrPlain(minN)}${en}₹${inrPlain(maxN)}`
        : cur && cur !== "USD"
          ? `${cur} ${fmtPlain(minN)}${en}${fmtPlain(maxN)}`
          : `$${fmtPlain(minN)}${en}$${fmtPlain(maxN)}`;
    if (kind === "hourly") return { label: `${label}/hr`, kind: "hourly", hide: false };
    return { label, kind: "fixed", hide: false };
  }

  if (minN != null) {
    const token = moneyToken(minN, cur);
    if (kind === "hourly") return { label: `${token}/hr`, kind: "hourly", hide: false };
    return { label: token, kind, hide: false };
  }
  if (maxN != null) {
    const token = moneyToken(maxN, cur);
    if (kind === "hourly") return { label: `${token}/hr`, kind: "hourly", hide: false };
    return { label: token, kind, hide: false };
  }

  return { label: "", kind: "unknown", hide: true };
}

/** Legacy: single `budget` on row with no import detail — show amount only. */
export function leadBudgetFallback(amount: number | null | undefined, platform: string | null | undefined): LeadBudgetDisplay {
  const n = Number(amount);
  if (!amount || Number.isNaN(n) || n <= 0) return { label: "", kind: "unknown", hide: true };
  const p = (platform ?? "").toLowerCase();
  const kind: BudgetType = p.includes("hour") ? "hourly" : "fixed";
  const line = `$${fmtCompact(n)}`;
  return { label: kind === "hourly" ? `${line}/hr` : line, kind, hide: false };
}
