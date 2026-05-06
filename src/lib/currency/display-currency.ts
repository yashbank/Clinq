import type { SupportedDisplayCurrency } from "@/types/currency";

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
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: rounded >= 1000 && currency !== "INR" ? 0 : 2,
    }).format(rounded);
  } catch {
    return `${currency} ${rounded.toLocaleString()}`;
  }
}
