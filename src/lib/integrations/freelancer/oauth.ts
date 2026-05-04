import "server-only";

import { getFreelancerIntegrationEnv, getFreelancerRedirectUri } from "@/lib/integrations/freelancer/env";

export function buildFreelancerAuthorizeUrl(args: { siteBaseUrl: string; state: string }): string | null {
  const cfg = getFreelancerIntegrationEnv();
  if (!cfg) return null;
  const redirectUri = getFreelancerRedirectUri(args.siteBaseUrl);
  const u = new URL(cfg.authorizePath, cfg.accountsBaseUrl);
  u.searchParams.set("response_type", "code");
  u.searchParams.set("client_id", cfg.clientId);
  u.searchParams.set("redirect_uri", redirectUri);
  u.searchParams.set("scope", "basic");
  u.searchParams.set("state", args.state);
  return u.toString();
}

export type FreelancerTokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
};

export async function exchangeFreelancerAuthorizationCode(args: {
  siteBaseUrl: string;
  code: string;
}): Promise<{ ok: true; tokens: FreelancerTokenResponse } | { ok: false; error: string }> {
  const cfg = getFreelancerIntegrationEnv();
  if (!cfg) {
    return { ok: false, error: "Freelancer OAuth is not configured" };
  }
  const redirectUri = getFreelancerRedirectUri(args.siteBaseUrl);
  const tokenUrl = new URL(cfg.tokenPath, cfg.accountsBaseUrl).toString();

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code: args.code,
    client_id: cfg.clientId,
    client_secret: cfg.clientSecret,
    redirect_uri: redirectUri,
  });

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 25_000);
  try {
    const res = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
      body: body.toString(),
      signal: controller.signal,
    });
    const text = await res.text();
    let json: unknown;
    try {
      json = JSON.parse(text) as unknown;
    } catch {
      return { ok: false, error: `Token response not JSON (${res.status})` };
    }
    if (!res.ok) {
      const msg =
        json && typeof json === "object" && "message" in json && typeof (json as { message: unknown }).message === "string"
          ? (json as { message: string }).message
          : `Token exchange failed (${res.status})`;
      return { ok: false, error: msg };
    }
    const obj = json as Record<string, unknown>;
    const access = typeof obj.access_token === "string" ? obj.access_token : null;
    if (!access) {
      return { ok: false, error: "Token response missing access_token" };
    }
    const refresh = typeof obj.refresh_token === "string" ? obj.refresh_token : undefined;
    const expires_in = typeof obj.expires_in === "number" ? obj.expires_in : undefined;
    return { ok: true, tokens: { access_token: access, refresh_token: refresh, expires_in } };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Token exchange failed";
    return { ok: false, error: e instanceof Error && e.name === "AbortError" ? "Token request timed out" : msg };
  } finally {
    clearTimeout(t);
  }
}
