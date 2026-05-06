export const SUPPORTED_DISPLAY_CURRENCIES = ["USD", "INR", "GBP", "CAD", "EUR"] as const;
export type SupportedDisplayCurrency = (typeof SUPPORTED_DISPLAY_CURRENCIES)[number];

export function isSupportedDisplayCurrency(v: string): v is SupportedDisplayCurrency {
  return (SUPPORTED_DISPLAY_CURRENCIES as readonly string[]).includes(v);
}
