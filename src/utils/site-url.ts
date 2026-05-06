/**
 * Public site origin for auth redirects, email links, and OAuth callbacks.
 * Always set `NEXT_PUBLIC_SITE_URL` on Vercel (e.g. https://your-app.vercel.app).
 */
export function getPublicSiteOrigin(fallbackOrigin: string): string {
  const fromEnv = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "").trim();
  if (fromEnv) return fromEnv;
  return (fallbackOrigin ?? "").replace(/\/$/, "").trim();
}
