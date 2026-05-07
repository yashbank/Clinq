import "server-only";

import {
  acquireSupabaseForIntegrationOauthTokens,
  mapTokenPersistenceErrorForUser,
} from "@/lib/integrations/freelancer/save-freelancer-token-server-side";
import { hasSupabaseServiceRoleKey } from "@/utils/env-server";

function looksLikeGithubToken(raw: string): boolean {
  const t = raw.trim();
  if (t.length < 20 || t.length > 2000) return false;
  return (
    t.startsWith("ghp_") ||
    t.startsWith("github_pat_") ||
    t.startsWith("gho_") ||
    t.startsWith("ghu_") ||
    t.startsWith("ghs_") ||
    t.startsWith("ghr_")
  );
}

export async function userHasGithubImportPatRow(userId: string): Promise<boolean> {
  if (!hasSupabaseServiceRoleKey()) return false;
  try {
    const admin = acquireSupabaseForIntegrationOauthTokens();
    const { data, error } = await admin.from("integration_github_import_pat").select("user_id").eq("user_id", userId).maybeSingle();
    if (error) return false;
    return Boolean(data?.user_id);
  } catch {
    return false;
  }
}

export async function getGithubImportPatForUser(userId: string): Promise<string | null> {
  if (!hasSupabaseServiceRoleKey()) return null;
  try {
    const admin = acquireSupabaseForIntegrationOauthTokens();
    const { data, error } = await admin.from("integration_github_import_pat").select("pat").eq("user_id", userId).maybeSingle();
    if (error || !data?.pat || typeof data.pat !== "string") return null;
    const p = data.pat.trim();
    return p.length ? p : null;
  } catch {
    return null;
  }
}

export async function upsertGithubImportPatForUser(
  userId: string,
  pat: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!hasSupabaseServiceRoleKey()) {
    return { ok: false, error: "Server is missing SUPABASE_SERVICE_ROLE_KEY (required to store GitHub tokens securely)." };
  }
  const trimmed = pat.trim();
  if (!looksLikeGithubToken(trimmed)) {
    return { ok: false, error: "Enter a valid GitHub personal access token (classic ghp_… or fine-grained github_pat_…)." };
  }
  try {
    const admin = acquireSupabaseForIntegrationOauthTokens();
    const { error } = await admin.from("integration_github_import_pat").upsert(
      { user_id: userId, pat: trimmed, updated_at: new Date().toISOString() },
      { onConflict: "user_id" },
    );
    if (error) return { ok: false, error: mapTokenPersistenceErrorForUser(error.message) };
    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return { ok: false, error: mapTokenPersistenceErrorForUser(message) };
  }
}

export async function clearGithubImportPatForUser(userId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!hasSupabaseServiceRoleKey()) {
    return { ok: false, error: "Server is missing SUPABASE_SERVICE_ROLE_KEY (required to clear GitHub tokens securely)." };
  }
  try {
    const admin = acquireSupabaseForIntegrationOauthTokens();
    const { error } = await admin.from("integration_github_import_pat").delete().eq("user_id", userId);
    if (error) return { ok: false, error: mapTokenPersistenceErrorForUser(error.message) };
    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return { ok: false, error: mapTokenPersistenceErrorForUser(message) };
  }
}
