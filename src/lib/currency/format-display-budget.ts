import {
  convertUsdToDisplayCurrency,
  formatCurrencyAmount,
  mergeUsdToForeignRates,
} from "@/lib/currency/display-currency";
import { isSupportedDisplayCurrency, type SupportedDisplayCurrency } from "@/types/currency";

function resolvePref(preferredCurrency: string | null | undefined): SupportedDisplayCurrency {
  const raw = preferredCurrency ?? "USD";
  return isSupportedDisplayCurrency(raw) ? raw : "USD";
}

/** Compact fixed budgets: 1.2k, 2M style in display currency (Binance-like). INR uses full grouping under 10L. */
export function formatFixedBudgetCompact(amount: number, currency: SupportedDisplayCurrency): string {
  const n = Math.round(amount * 100) / 100;
  const abs = Math.abs(n);
  if (currency === "CAD") {
    if (abs >= 1_000_000) return `C$${(n / 1_000_000).toFixed(1)}M`;
    if (abs >= 1000) return `C$${(n / 1000).toFixed(abs >= 10_000 ? 0 : 1)}k`;
    return `C$${n.toLocaleString("en-US", { maximumFractionDigits: abs < 100 ? 2 : 0 })}`;
  }
  if (currency === "INR") {
    if (abs >= 10_000_000) {
      return `₹${(n / 10_000_000).toFixed(n >= 100_000_000 ? 0 : 1)}Cr`;
    }
    if (abs >= 1_000_000) {
      return `₹${(n / 100_000).toFixed(abs >= 10_000_000 ? 0 : 1)}L`;
    }
    return formatCurrencyAmount(n, "INR");
  }
  if (abs >= 1_000_000) {
    const sym = currency === "USD" ? "$" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : "";
    if (sym) return `${sym}${(n / 1_000_000).toFixed(1)}M`;
  }
  if (abs >= 1000) {
    if (currency === "USD") return `$${(n / 1000).toFixed(n >= 10_000 ? 0 : 1)}k`;
    if (currency === "EUR") return `€${(n / 1000).toFixed(n >= 10_000 ? 0 : 1)}k`;
    if (currency === "GBP") return `£${(n / 1000).toFixed(n >= 10_000 ? 0 : 1)}k`;
  }
  return formatCurrencyAmount(n, currency);
}

/**
 * Single product-wide formatter: USD stored amount → preferred currency, hourly vs fixed suffix.
 */
export function formatBudgetUsdForDisplay(
  budgetUsd: number | null | undefined,
  preferredCurrency: string | null | undefined,
  usdToForeignRates: Record<string, number> | null | undefined,
  budgetKind: "fixed" | "hourly" | "unknown",
): { label: string; show: boolean } {
  if (budgetUsd == null || !Number.isFinite(budgetUsd) || budgetUsd <= 0) {
    return { label: "", show: false };
  }
  const pref = resolvePref(preferredCurrency);
  const merged = mergeUsdToForeignRates(usdToForeignRates);
  const local = convertUsdToDisplayCurrency(budgetUsd, pref, merged);
  const displayCur: SupportedDisplayCurrency = pref;
  const kind = budgetKind === "hourly" ? "hourly" : "fixed";
  if (kind === "hourly") {
    const per = formatCurrencyAmount(local, displayCur);
    return { label: `${per}/hr`, show: true };
  }
  return { label: formatFixedBudgetCompact(local, displayCur), show: true };
}
