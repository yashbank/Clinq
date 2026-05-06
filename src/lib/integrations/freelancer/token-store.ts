import "server-only";

import { logOAuthTokenError, logOAuthTokenInfo, logOAuthTokenWarn } from "@/lib/integrations/freelancer/oauth-logger";
import {
  acquireSupabaseForIntegrationOauthTokens,
  mapTokenPersistenceErrorForUser,
  saveFreelancerTokenServerSide,
} from "@/lib/integrations/freelancer/save-freelancer-token-server-side";

export type StoredFreelancerTokens = {
  access_token: string;
  refresh_token: string | null;
  token_expires_at: string | null;
};

/**
 * Upsert Freelancer tokens for a user. Delegates to the single validated service-role path.
 */
export async function upsertFreelancerTokensForUser(
  userId: string,
  tokens: { access_token: string; refresh_token?: string; expires_in?: number },
): Promise<{ ok: true } | { ok: false; error: string }> {
  return saveFreelancerTokenServerSide(userId, tokens);
}

export async function getFreelancerTokensForUser(userId: string): Promise<StoredFreelancerTokens | null> {
  try {
    const admin = acquireSupabaseForIntegrationOauthTokens();
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
    const admin = acquireSupabaseForIntegrationOauthTokens();
    const { error } = await admin.from("integration_oauth_tokens").delete().eq("user_id", userId).eq("provider", "freelancer");
    if (error) {
      logOAuthTokenError("delete integration_oauth_tokens failed", { userId, message: error.message });
      return { ok: false, error: mapTokenPersistenceErrorForUser(error.message) };
    }
    logOAuthTokenInfo("integration_oauth_tokens deleted", { userId, provider: "freelancer" });
    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    logOAuthTokenError("deleteFreelancerTokensForUser threw", { userId, message });
    return { ok: false, error: mapTokenPersistenceErrorForUser(message) };
  }
}
