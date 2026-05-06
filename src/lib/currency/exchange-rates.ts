import "server-only";

type FrankfurterLatest = {
  amount: number;
  base: string;
  date: string;
  rates: Record<string, number>;
};

let cache: { expires: number; rates: Record<string, number> } | null = null;
const TTL_MS = 60 * 60 * 1000;

/**
 * Rates from USD → foreign (multiply USD by rate to get foreign amount).
 * Frankfurter ECB data — no API key.
 */
export async function getUsdToForeignRates(): Promise<Record<string, number>> {
  const now = Date.now();
  if (cache && cache.expires > now) {
    return cache.rates;
  }

  const url =
    "https://api.frankfurter.app/v1/latest?from=USD&to=EUR,GBP,INR,CAD";
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Frankfurter HTTP ${res.status}: ${body.slice(0, 200)}`);
  }
  const json = (await res.json()) as FrankfurterLatest;
  const rates = json.rates && typeof json.rates === "object" ? { ...json.rates } : {};
  cache = { expires: now + TTL_MS, rates };
  return rates;
}

/** Average of min and max when both exist; otherwise whichever exists. */
export function averageBudgetAmount(min: number | null, max: number | null): number | null {
  if (min != null && max != null && Number.isFinite(min) && Number.isFinite(max)) {
    return Math.round(((min + max) / 2) * 100) / 100;
  }
  if (min != null && Number.isFinite(min)) return Math.round(min * 100) / 100;
  if (max != null && Number.isFinite(max)) return Math.round(max * 100) / 100;
  return null;
}

/**
 * Convert an amount in `currency` (ISO) to USD using USD-base rates (divide by USD→currency rate).
 */
export async function convertAmountToUsd(amount: number, currency: string | null | undefined): Promise<number | null> {
  const cur = (currency ?? "USD").trim().toUpperCase();
  if (!Number.isFinite(amount)) return null;
  if (cur === "USD") return Math.round(amount * 100) / 100;

  const rates = await getUsdToForeignRates();
  const r = rates[cur];
  if (!r || !Number.isFinite(r) || r <= 0) return null;
  return Math.round((amount / r) * 100) / 100;
}
