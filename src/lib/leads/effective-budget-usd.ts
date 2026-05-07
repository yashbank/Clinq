import { averageBudgetAmount } from "@/lib/currency/budget-math";
import { extractImportBudgetFields } from "@/lib/currency/import-budget-fields";
import type { LeadRow } from "@/types/database";

function readImportBudget(meta: Record<string, unknown>): {
  min: number | null;
  max: number | null;
  currency: string | null;
} {
  return extractImportBudgetFields(meta);
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

/** Detect rows where `budget_usd` was mistakenly copied from `budget_avg` in a non-USD currency. */
export function isLikelyMisstoredForeignAvgAsUsd(
  budgetUsd: number,
  budgetAvg: number | null,
  currencyOriginal: string | null,
): boolean {
  if (budgetAvg == null || !Number.isFinite(budgetAvg) || budgetAvg <= 0) return false;
  const c = (currencyOriginal ?? "").trim().toUpperCase();
  if (!c || c === "USD") return false;
  return Math.abs(budgetUsd - budgetAvg) < 0.05;
}

/**
 * Single canonical USD amount for totals and display-currency conversion.
 *
 * Priority: `budget_usd` (unless corrupt duplicate of foreign avg) → import metadata range/currency
 * (fixes wrong `currency_original` on column) → `budget_avg` + `currency_original` → legacy `budget`.
 */
export function resolveEffectiveBudgetUsd(
  row: Pick<LeadRow, "budget" | "budget_usd" | "budget_avg" | "budget_min" | "budget_max" | "currency_original" | "metadata">,
  rates: Record<string, number> | null | undefined,
): number | null {
  const hasRates = Boolean(rates && Object.keys(rates).length > 0);
  const mergedRates = rates ?? {};

  const meta =
    row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata)
      ? (row.metadata as Record<string, unknown>)
      : {};

  const { min: impMin, max: impMax, currency: impCurrency } = readImportBudget(meta);
  const avgImpRange = averageBudgetAmount(impMin, impMax);

  const avgCol = typeof row.budget_avg === "number" && row.budget_avg > 0 && Number.isFinite(row.budget_avg) ? row.budget_avg : null;
  const curCol =
    typeof row.currency_original === "string" && row.currency_original.trim()
      ? row.currency_original.trim().toUpperCase()
      : null;

  const curForMisstore =
    impCurrency && impCurrency.trim().toUpperCase() !== "USD" ? impCurrency.trim().toUpperCase() : curCol;

  /** Column labeled USD + huge average + import metadata says non-USD → do not trust raw `budget_usd`. */
  const suspiciousUsdForeignAvg =
    curCol === "USD" &&
    avgCol != null &&
    avgCol >= 500_000 &&
    impCurrency != null &&
    impCurrency !== "USD" &&
    typeof row.budget_usd === "number" &&
    Number.isFinite(row.budget_usd) &&
    row.budget_usd > 0 &&
    Math.abs(row.budget_usd - avgCol) < 0.05;

  if (typeof row.budget_usd === "number" && Number.isFinite(row.budget_usd) && row.budget_usd > 0) {
    if (!isLikelyMisstoredForeignAvgAsUsd(row.budget_usd, avgCol, curForMisstore) && !suspiciousUsdForeignAvg) {
      return row.budget_usd;
    }
    if (hasRates && avgCol != null && curForMisstore && curForMisstore !== "USD") {
      const healed = foreignAmountToUsd(avgCol, curForMisstore, mergedRates);
      if (healed != null && healed > 0) return healed;
    }
    // Fall through — do not trust mis-stored budget_usd
  }

  if (avgImpRange != null && impCurrency) {
    if (impCurrency === "USD") {
      const u = Math.round(avgImpRange * 100) / 100;
      if (u > 0) return u;
    }
    if (hasRates) {
      const u = foreignAmountToUsd(avgImpRange, impCurrency, mergedRates);
      if (u != null && u > 0) return u;
    }
  }

  /** Column says USD but import metadata has a non-USD ISO (historical mis-label). */
  if (impCurrency && impCurrency !== "USD" && curCol === "USD" && avgCol != null && hasRates) {
    const u = foreignAmountToUsd(avgCol, impCurrency, mergedRates);
    if (u != null && u > 0) return u;
  }

  if (avgCol != null && curCol) {
    if (curCol === "USD") return Math.round(avgCol * 100) / 100;
    if (hasRates) {
      const u = foreignAmountToUsd(avgCol, curCol, mergedRates);
      if (u != null && u > 0) return u;
    }
  }

  const leg = Number(row.budget);
  if (leg > 0 && Number.isFinite(leg)) {
    const foreignHint = (curCol && curCol !== "USD") || (impCurrency && impCurrency !== "USD");
    if (foreignHint) {
      return null;
    }
    return Math.round(leg * 100) / 100;
  }
  return null;
}
