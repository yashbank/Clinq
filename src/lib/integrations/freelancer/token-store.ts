import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type StoredFreelancerTokens = {
  access_token: string;
  refresh_token: string | null;
  token_expires_at: string | null;
};

export async function upsertFreelancerTokensForUser(
  userId: string,
  tokens: { access_token: string; refresh_token?: string; expires_in?: number },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = createSupabaseAdminClient();
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
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

export async function getFreelancerTokensForUser(userId: string): Promise<StoredFreelancerTokens | null> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("integration_oauth_tokens")
    .select("access_token, refresh_token, token_expires_at")
    .eq("user_id", userId)
    .eq("provider", "freelancer")
    .maybeSingle();

  if (error || !data?.access_token) {
    return null;
  }
  return {
    access_token: data.access_token as string,
    refresh_token: (data.refresh_token as string | null) ?? null,
    token_expires_at: (data.token_expires_at as string | null) ?? null,
  };
}

export async function deleteFreelancerTokensForUser(userId: string): Promise<void> {
  const admin = createSupabaseAdminClient();
  await admin.from("integration_oauth_tokens").delete().eq("user_id", userId).eq("provider", "freelancer");
}
