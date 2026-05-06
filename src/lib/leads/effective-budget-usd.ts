import { averageBudgetAmount } from "@/lib/currency/budget-math";
import type { LeadRow } from "@/types/database";

function readImportBudget(meta: Record<string, unknown>): {
  min: number | null;
  max: number | null;
  currency: string | null;
} {
  const imp = meta.import;
  if (!imp || typeof imp !== "object" || Array.isArray(imp)) {
    return { min: null, max: null, currency: null };
  }
  const r = imp as Record<string, unknown>;
  const min = typeof r.budget_min === "number" && Number.isFinite(r.budget_min) ? r.budget_min : null;
  const max = typeof r.budget_max === "number" && Number.isFinite(r.budget_max) ? r.budget_max : null;
  const cur = typeof r.currency_code === "string" && r.currency_code.trim() ? r.currency_code.trim().toUpperCase() : null;
  return { min, max, currency: cur };
}

/**
 * Convert an amount in `currency` (ISO) to USD using Frankfurter-style USD→foreign rates
 * (multiply USD by rate to get foreign → divide foreign by rate for USD).
 */
export function foreignAmountToUsd(amount: number, currency: string, rates: Record<string, number>): number | null {
  const cur = (currency || "USD").trim().toUpperCase();
  if (!Number.isFinite(amount) || amount <= 0) return null;
  if (cur === "USD") return Math.round(amount * 100) / 100;
  const r = rates[cur];
  if (!r || !Number.isFinite(r) || r <= 0) return null;
  return Math.round((amount / r) * 100) / 100;
}

/**
 * Single canonical USD amount for totals and display-currency conversion.
 *
 * Priority: `budget_usd` → convert `budget_avg` + `currency_original` → import metadata avg → legacy `budget` as USD.
 */
export function resolveEffectiveBudgetUsd(
  row: Pick<LeadRow, "budget" | "budget_usd" | "budget_avg" | "budget_min" | "budget_max" | "currency_original" | "metadata">,
  rates: Record<string, number> | null | undefined,
): number | null {
  if (typeof row.budget_usd === "number" && Number.isFinite(row.budget_usd) && row.budget_usd > 0) {
    return row.budget_usd;
  }

  const hasRates = rates && Object.keys(rates).length > 0;

  const avgCol = typeof row.budget_avg === "number" && row.budget_avg > 0 && Number.isFinite(row.budget_avg) ? row.budget_avg : null;
  const curCol =
    typeof row.currency_original === "string" && row.currency_original.trim()
      ? row.currency_original.trim().toUpperCase()
      : null;

  if (avgCol != null && curCol) {
    if (curCol === "USD") return Math.round(avgCol * 100) / 100;
    if (hasRates) {
      const u = foreignAmountToUsd(avgCol, curCol, rates!);
      if (u != null && u > 0) return u;
    }
  }

  const meta =
    row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata)
      ? (row.metadata as Record<string, unknown>)
      : {};
  const { min, max, currency } = readImportBudget(meta);
  const avgImp = averageBudgetAmount(min, max);
  if (avgImp != null && currency) {
    if (currency === "USD") return avgImp;
    if (hasRates) {
      const u = foreignAmountToUsd(avgImp, currency, rates!);
      if (u != null && u > 0) return u;
    }
  }

  const leg = Number(row.budget);
  if (leg > 0 && Number.isFinite(leg)) {
    return Math.round(leg * 100) / 100;
  }
  return null;
}
