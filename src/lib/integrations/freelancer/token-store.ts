import "server-only";

import { logOAuthTokenError, logOAuthTokenInfo, logOAuthTokenWarn } from "@/lib/integrations/freelancer/oauth-logger";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseServiceRoleKey } from "@/utils/env-server";

export type StoredFreelancerTokens = {
  access_token: string;
  refresh_token: string | null;
  token_expires_at: string | null;
};

function requireAdmin() {
  if (!hasSupabaseServiceRoleKey()) {
    logOAuthTokenError("Refusing integration_oauth_tokens access without service role key");
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for integration_oauth_tokens");
  }
  return createSupabaseAdminClient();
}

/**
 * Upsert Freelancer tokens for a user. MUST run on the server with service role only.
 * Never use the anon/authenticated Supabase client for this table.
 */
export async function upsertFreelancerTokensForUser(
  userId: string,
  tokens: { access_token: string; refresh_token?: string; expires_in?: number },
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const admin = requireAdmin();
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
      logOAuthTokenError("upsert integration_oauth_tokens failed", { userId, message: error.message, code: error.code });
      return { ok: false, error: error.message };
    }
    logOAuthTokenInfo("integration_oauth_tokens upserted", { userId, provider: "freelancer" });
    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    logOAuthTokenError("upsertFreelancerTokensForUser threw", { userId, message });
    return { ok: false, error: message };
  }
}

export async function getFreelancerTokensForUser(userId: string): Promise<StoredFreelancerTokens | null> {
  try {
    const admin = requireAdmin();
    const { data, error } = await admin
      .from("integration_oauth_tokens")
      .select("access_token, refresh_token, token_expires_at")
      .eq("user_id", userId)
      .eq("provider", "freelancer")
      .maybeSingle();

    if (error) {
      logOAuthTokenWarn("read integration_oauth_tokens failed", { userId, message: error.message });
      return null;
    }
    if (!data?.access_token) {
      return null;
    }
    return {
      access_token: data.access_token as string,
      refresh_token: (data.refresh_token as string | null) ?? null,
      token_expires_at: (data.token_expires_at as string | null) ?? null,
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    logOAuthTokenWarn("getFreelancerTokensForUser threw", { userId, message });
    return null;
  }
}

export async function deleteFreelancerTokensForUser(userId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const admin = requireAdmin();
    const { error } = await admin.from("integration_oauth_tokens").delete().eq("user_id", userId).eq("provider", "freelancer");
    if (error) {
      logOAuthTokenError("delete integration_oauth_tokens failed", { userId, message: error.message });
      return { ok: false, error: error.message };
    }
    logOAuthTokenInfo("integration_oauth_tokens deleted", { userId, provider: "freelancer" });
    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    logOAuthTokenError("deleteFreelancerTokensForUser threw", { userId, message });
    return { ok: false, error: message };
  }
}
