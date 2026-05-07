/**
 * Freelancer `currency_id` integers on project `budget` / `currency` objects → ISO 4217.
 * Source: `GET https://www.freelancer.com/api/projects/0.1/currencies/?compact=true` (official API).
 * Extend this map when the API adds currencies; unknown ids return null (caller treats as low-confidence).
 */
const FREELANCER_CURRENCY_ID_TO_ISO: Record<number, string> = {
  1: "USD",
  2: "NZD",
  3: "AUD",
  4: "GBP",
  5: "HKD",
  6: "SGD",
  8: "EUR",
  9: "CAD",
  11: "INR",
};

export function freelancerCurrencyIdToIso(currencyId: number | null): string | null {
  if (currencyId == null || !Number.isFinite(currencyId)) return null;
  const iso = FREELANCER_CURRENCY_ID_TO_ISO[Math.trunc(currencyId)];
  return typeof iso === "string" && iso.length === 3 ? iso : null;
}
