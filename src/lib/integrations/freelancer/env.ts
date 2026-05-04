import "server-only";

/**
 * Freelancer OAuth + API configuration. Returns null when not configured (UI hides OAuth).
 */
export function getFreelancerIntegrationEnv(): {
  clientId: string;
  clientSecret: string;
  apiBaseUrl: string;
  accountsBaseUrl: string;
  authorizePath: string;
  tokenPath: string;
} | null {
  const clientId = process.env.FREELANCER_CLIENT_ID?.trim();
  const clientSecret = process.env.FREELANCER_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) {
    return null;
  }
  const accountsBaseUrl = (process.env.FREELANCER_ACCOUNTS_BASE_URL ?? "https://accounts.freelancer.com").replace(/\/$/, "");
  const apiBaseUrl = (process.env.FREELANCER_API_BASE_URL ?? "https://www.freelancer.com").replace(/\/$/, "");
  return {
    clientId,
    clientSecret,
    apiBaseUrl,
    accountsBaseUrl,
    authorizePath: "/oauth/authorise",
    tokenPath: "/oauth/token",
  };
}

export function getFreelancerRedirectUri(siteBaseUrl: string): string {
  const base = siteBaseUrl.replace(/\/$/, "");
  return `${base}/api/integrations/freelancer/callback`;
}
