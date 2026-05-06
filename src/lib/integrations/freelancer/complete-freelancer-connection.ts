import "server-only";

import { upsertFreelancerTokensForUser } from "@/lib/integrations/freelancer/token-store";
import { logOAuthTokenError, logOAuthTokenInfo } from "@/lib/integrations/freelancer/oauth-logger";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseServiceRoleKey } from "@/utils/env-server";

type ConnectionKind = "oauth2" | "personal_token";

/**
 * Persists Freelancer tokens (service role) and marks integration_accounts connected.
 * All DB access uses the admin client — never the anon/browser Supabase client.
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

  const tok = await upsertFreelancerTokensForUser(userId, tokens);
  if (!tok.ok) {
    return tok;
  }

  const admin = createSupabaseAdminClient();
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
    return { ok: false, error: accErr.message };
  }

  logOAuthTokenInfo("Freelancer connection recorded", { userId, connectionKind: meta.connectionKind });
  return { ok: true };
}
