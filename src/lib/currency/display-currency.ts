import type { SupportedDisplayCurrency } from "@/types/currency";

/**
 * Approximate USD→foreign rates (foreign currency per 1 USD) for display only when the API
 * returns nothing. Live Frankfurter rates override these keys when present.
 */
export const DISPLAY_FX_FALLBACK_USD: Record<string, number> = {
  EUR: 0.92,
  GBP: 0.79,
  INR: 84,
  CAD: 1.36,
};

export function mergeUsdToForeignRates(rates: Record<string, number> | null | undefined): Record<string, number> {
  return { ...DISPLAY_FX_FALLBACK_USD, ...(rates ?? {}) };
}

export function convertUsdToDisplayCurrency(
  usd: number,
  target: SupportedDisplayCurrency,
  rates: Record<string, number>,
): number {
  if (!Number.isFinite(usd)) return usd;
  if (target === "USD") return Math.round(usd * 100) / 100;
  const r = rates[target];
  if (!r || !Number.isFinite(r)) return Math.round(usd * 100) / 100;
  return Math.round(usd * r * 100) / 100;
}

export function formatCurrencyAmount(amount: number, currency: SupportedDisplayCurrency): string {
  const rounded = Math.round(amount * 100) / 100;
  try {
    const locale = currency === "CAD" ? "en-CA" : currency === "INR" ? "en-IN" : "en-US";
    const formatted = new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: currency === "INR" ? 0 : rounded >= 1000 ? 0 : 2,
    }).format(rounded);
    if (currency === "CAD") {
      return formatted.replace(/\bCA\$\b/g, "C$").replace(/\bCAD\s/g, "C$ ");
    }
    return formatted;
  } catch {
    if (currency === "CAD") return `C$${rounded.toLocaleString("en-US")}`;
    return `${currency} ${rounded.toLocaleString()}`;
  }
}
