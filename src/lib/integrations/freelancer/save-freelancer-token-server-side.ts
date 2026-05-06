import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { logOAuthTokenError, logOAuthTokenInfo } from "@/lib/integrations/freelancer/oauth-logger";
import {
  assertServiceRoleSupabaseKey,
  decodeSupabaseJwtRole,
  EXPECTED_JWT_ROLE,
} from "@/lib/supabase/service-role-key-guard";
import { getSupabasePublicEnv } from "@/utils/env-public";
import { getSupabaseServiceRoleKey, hasSupabaseServiceRoleKey } from "@/utils/env-server";

function assertNotBrowserBundle(): void {
  if (typeof globalThis !== "undefined" && typeof (globalThis as unknown as { window?: unknown }).window !== "undefined") {
    throw new Error("integration_oauth_tokens persistence must never run in the browser bundle");
  }
}

function logPersistContext(event: string, ctx: Record<string, unknown> = {}) {
  console.info(
    JSON.stringify({
      scope: "freelancer_oauth_token_persist",
      event,
      ts: new Date().toISOString(),
      serviceRoleKeyConfigured: hasSupabaseServiceRoleKey(),
      ...ctx,
    }),
  );
}

/**
 * Returns a Supabase client authorized as `service_role` for `integration_oauth_tokens` only.
 * Throws if env is wrong (e.g. anon key pasted into SUPABASE_SERVICE_ROLE_KEY — the usual RLS failure).
 */
export function acquireSupabaseForIntegrationOauthTokens(): SupabaseClient {
  assertNotBrowserBundle();

  const { NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY } = getSupabasePublicEnv();

  if (!hasSupabaseServiceRoleKey()) {
    logPersistContext("missing_service_role_key", { anonKeyLength: NEXT_PUBLIC_SUPABASE_ANON_KEY.length });
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing; cannot persist integration tokens server-side.");
  }

  let serviceKey: string;
  try {
    serviceKey = getSupabaseServiceRoleKey();
  } catch (e) {
    const message = e instanceof Error ? e.message : "invalid service role key";
    logOAuthTokenError("service_role_key_invalid", { message });
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is invalid; cannot persist integration tokens server-side.");
  }

  try {
    assertServiceRoleSupabaseKey(serviceKey, NEXT_PUBLIC_SUPABASE_ANON_KEY);
  } catch (e) {
    const message = e instanceof Error ? e.message : "invalid service role key";
    logOAuthTokenError("service_role_key_assertion_failed", { message });
    throw e;
  }

  const jwtRole = decodeSupabaseJwtRole(serviceKey);
  logPersistContext("admin_client_acquired", {
    jwtRole: jwtRole ?? "unreadable",
    expectedRole: EXPECTED_JWT_ROLE,
    usingPath: "acquireSupabaseForIntegrationOauthTokens",
  });

  return createClient(NEXT_PUBLIC_SUPABASE_URL, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function isRowLevelSecurityViolation(message: string): boolean {
  const m = message.toLowerCase();
  return m.includes("row-level security") || m.includes("rls") || m.includes("42501");
}

export function mapTokenPersistenceErrorForUser(message: string): string {
  if (isRowLevelSecurityViolation(message)) {
    return "Server-side token persistence failed. Check that SUPABASE_SERVICE_ROLE_KEY is the service_role secret from Supabase (not the anon key).";
  }
  return message;
}

type TokenPayload = { access_token: string; refresh_token?: string; expires_in?: number };

/**
 * Upsert into `integration_oauth_tokens` using an already-validated service-role client.
 * Callers must obtain `admin` only via `acquireSupabaseForIntegrationOauthTokens()`.
 */
export async function upsertFreelancerIntegrationOauthTokensWithServiceClient(
  admin: SupabaseClient,
  userId: string,
  tokens: TokenPayload,
): Promise<{ ok: true } | { ok: false; error: string }> {
  assertNotBrowserBundle();
  const expiresAt =
    typeof tokens.expires_in === "number" && Number.isFinite(tokens.expires_in)
      ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
      : null;

  const { error } = await admin.from("integration_oauth_tokens").upsert(
    {
      user_id: userId,
      provider: "freelancer",
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token ?? null,
      token_expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,provider" },
  );

  if (error) {
    logOAuthTokenError("save_upsert_failed", {
      userId,
      code: error.code,
      message: error.message,
      rls: isRowLevelSecurityViolation(error.message),
    });
    return { ok: false, error: mapTokenPersistenceErrorForUser(error.message) };
  }

  logOAuthTokenInfo("integration_oauth_tokens upserted", { userId, provider: "freelancer" });
  return { ok: true };
}

/**
 * Single server-only write path for `integration_oauth_tokens` (Freelancer).
 * Uses only the validated service-role client.
 */
export async function saveFreelancerTokenServerSide(
  userId: string,
  tokens: TokenPayload,
): Promise<{ ok: true } | { ok: false; error: string }> {
  assertNotBrowserBundle();
  logPersistContext("save_start", { userId, path: "saveFreelancerTokenServerSide" });

  try {
    const admin = acquireSupabaseForIntegrationOauthTokens();
    const res = await upsertFreelancerIntegrationOauthTokensWithServiceClient(admin, userId, tokens);
    if (!res.ok) {
      return res;
    }
    logPersistContext("save_ok", { userId });
    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    logOAuthTokenError("saveFreelancerTokenServerSide threw", { userId, message });
    return { ok: false, error: mapTokenPersistenceErrorForUser(message) };
  }
}
