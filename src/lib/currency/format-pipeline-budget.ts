import { convertUsdToDisplayCurrency, formatCurrencyAmount } from "@/lib/currency/display-currency";
import { isSupportedDisplayCurrency, type SupportedDisplayCurrency } from "@/types/currency";

/** Sum stored USD amounts for pipeline metrics (falls back to legacy `budget`). */
export function leadBudgetAsUsd(row: { budget: number | null; budget_usd?: number | null }): number {
  if (typeof row.budget_usd === "number" && Number.isFinite(row.budget_usd)) {
    return row.budget_usd;
  }
  return Number(row.budget) || 0;
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
