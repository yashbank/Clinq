/**
 * Server-only env check (call from Server Actions / RSC only).
 * Do not rely on this in client components — pass booleans from the server instead.
 */
export function isRedditOAuthAccessTokenConfigured(): boolean {
  return Boolean(process.env.REDDIT_OAUTH_ACCESS_TOKEN?.trim());
}
