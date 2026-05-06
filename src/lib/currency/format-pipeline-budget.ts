import { convertUsdToDisplayCurrency, formatCurrencyAmount } from "@/lib/currency/display-currency";
import { resolveEffectiveBudgetUsd } from "@/lib/leads/effective-budget-usd";
import { isSupportedDisplayCurrency, type SupportedDisplayCurrency } from "@/types/currency";
import type { LeadRow } from "@/types/database";

/** Sum canonical USD for pipeline / dashboard totals (uses FX when needed). */
export function leadBudgetAsUsd(
  row: Pick<LeadRow, "budget" | "budget_usd" | "budget_avg" | "budget_min" | "budget_max" | "currency_original" | "metadata">,
  usdToForeignRates?: Record<string, number> | null,
): number {
  return resolveEffectiveBudgetUsd(row, usdToForeignRates ?? null) ?? 0;
}

export function formatUsdTotalForDisplay(
  totalUsd: number,
  preferredCurrency: string,
  usdToForeignRates: Record<string, number> | null,
): string {
  const pref: SupportedDisplayCurrency = isSupportedDisplayCurrency(preferredCurrency) ? preferredCurrency : "USD";
  if (!usdToForeignRates || Object.keys(usdToForeignRates).length === 0) {
    if (totalUsd >= 1000) return `$${(totalUsd / 1000).toFixed(1)}k`;
    if (totalUsd > 0) return `$${Math.round(totalUsd).toLocaleString("en-US")}`;
    return "$0";
  }
  const local = convertUsdToDisplayCurrency(totalUsd, pref, usdToForeignRates);
  return formatCurrencyAmount(local, pref);
}
