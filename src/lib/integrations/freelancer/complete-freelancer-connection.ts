import "server-only";

import { logOAuthTokenError, logOAuthTokenInfo } from "@/lib/integrations/freelancer/oauth-logger";
import {
  acquireSupabaseForIntegrationOauthTokens,
  mapTokenPersistenceErrorForUser,
  upsertFreelancerIntegrationOauthTokensWithServiceClient,
} from "@/lib/integrations/freelancer/save-freelancer-token-server-side";
import { hasSupabaseServiceRoleKey } from "@/utils/env-server";

type ConnectionKind = "oauth2" | "personal_token";

/**
 * Persists Freelancer tokens (`integration_oauth_tokens`) and marks `integration_accounts` connected.
 * All privileged writes use the same validated service-role client (never the user-scoped SSR client).
 */
export async function completeFreelancerConnection(
  userId: string,
  tokens: { access_token: string; refresh_token?: string; expires_in?: number },
  meta: {
    connectionKind: ConnectionKind;
  },
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!hasSupabaseServiceRoleKey()) {
    logOAuthTokenError("Missing SUPABASE_SERVICE_ROLE_KEY; refusing token persistence");
    return { ok: false, error: "Server misconfigured: missing service role key" };
  }

  try {
    const admin = acquireSupabaseForIntegrationOauthTokens();

    const tok = await upsertFreelancerIntegrationOauthTokensWithServiceClient(admin, userId, tokens);
    if (!tok.ok) {
      return tok;
    }

    const now = new Date().toISOString();
    const metaBlock =
      meta.connectionKind === "oauth2"
        ? { oauth_connected_at: now, connection_kind: "oauth2" as const }
        : { pat_connected_at: now, connection_kind: "personal_token" as const };

    const { error: accErr } = await admin.from("integration_accounts").upsert(
      {
        user_id: userId,
        provider: "freelancer",
        status: "connected",
        meta: metaBlock,
        credentials: {
          version: 1,
          storage: "integration_oauth_tokens",
        },
        sync_status: "idle",
        updated_at: now,
      },
      { onConflict: "user_id,provider" },
    );

    if (accErr) {
      logOAuthTokenError("integration_accounts upsert failed after token write", {
        userId,
        message: accErr.message,
      });
      return { ok: false, error: mapTokenPersistenceErrorForUser(accErr.message) };
    }

    logOAuthTokenInfo("Freelancer connection recorded", { userId, connectionKind: meta.connectionKind });
    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    logOAuthTokenError("completeFreelancerConnection threw", { userId, message });
    return { ok: false, error: mapTokenPersistenceErrorForUser(message) };
  }
}
