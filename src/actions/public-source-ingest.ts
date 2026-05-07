"use server";

import { revalidatePath } from "next/cache";

import { recordLeadImportBatchMetrics } from "@/lib/analytics/record-lead-import-metrics";
import { getGithubImportPatForUser } from "@/lib/integrations/github/github-import-pat-store";
import { publicIngestCapForSource } from "@/lib/integrations/source-batch-caps";
import { isRedditOAuthAccessTokenConfigured } from "@/lib/integrations/reddit-import-env";
import { getPublicIngestAdapter, type PublicIngestSourceId } from "@/lib/leads/sources/registry";
import { processScrapedLeads } from "@/lib/leads/process-scraped-leads";
import { loadFreelancerProfileForAi } from "@/lib/profile/load-for-ai";
import { assessProfileCompleteness, profileCompletenessGateMessage } from "@/lib/profile/profile-completeness";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasSupabaseServiceRoleKey } from "@/utils/env-server";

export type PublicIngestResult = {
  ok: true;
  source: PublicIngestSourceId;
  fetched_count: number;
  scraped_staged_count: number;
  duplicate_count: number;
  skipped_invalid_count: number;
  promoted_count: number;
  skipped_irrelevant_count: number;
  skipped_persist_failed_count: number;
  errors: string[];
};

export async function runPublicSourceIngestAction(
  source: PublicIngestSourceId,
  payload: { query: string; limit?: number },
): Promise<PublicIngestResult | { ok: false; error: string }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Unauthorized" };
  }

  const profFull = await loadFreelancerProfileForAi(supabase, user.id);
  const gate = assessProfileCompleteness(profFull);
  if (!gate.passesCuratedLeadWorkflow) {
    return { ok: false, error: profileCompletenessGateMessage(gate) };
  }

  const adapter = getPublicIngestAdapter(source);
  const query = (payload.query ?? "").trim();
  if (!query) {
    return { ok: false, error: "Search query is required" };
  }

  const envGithub = Boolean(process.env.GITHUB_PUBLIC_IMPORT_TOKEN?.trim());
  const userGithubPat =
    hasSupabaseServiceRoleKey() && source === "github" ? await getGithubImportPatForUser(user.id) : null;
  const githubHasElevatedToken = Boolean(userGithubPat?.trim() || envGithub);

  const cap = publicIngestCapForSource(source, {
    redditOAuthConfigured: isRedditOAuthAccessTokenConfigured(),
    githubHasElevatedToken,
  });
  if (cap.disabled) {
    return { ok: false, error: cap.summary };
  }

  const limit = Math.min(cap.maxPerRun, Math.max(1, payload.limit ?? Math.min(12, cap.maxPerRun)));

  const fetched = await adapter.fetchRaw(
    { query, limit },
    source === "github" ? { githubToken: userGithubPat ?? process.env.GITHUB_PUBLIC_IMPORT_TOKEN ?? null } : undefined,
  );
  if (!fetched.ok) {
    return { ok: false, error: fetched.error };
  }

  const importedAt = new Date().toISOString();
  const items = fetched.items;

  const normalizedPreview = items
    .map((item) => adapter.normalize(item, importedAt))
    .filter((x): x is NonNullable<typeof x> => Boolean(x));
  const extIds = normalizedPreview
    .map((n) => n.metadataExtra.import_external_id)
    .filter((x): x is string => typeof x === "string" && x.length > 0);

  const existing = new Set<string>();
  if (extIds.length > 0) {
    const { data: existingArr, error: rpcErr } = await supabase.rpc("lead_import_ext_ids_existing", {
      p_ext_ids: extIds,
    });
    if (rpcErr) {
      return { ok: false, error: rpcErr.message };
    }
    if (Array.isArray(existingArr)) {
      for (const x of existingArr as string[]) {
        if (typeof x === "string" && x) existing.add(x);
      }
    }
  }

  let scraped_staged_count = 0;
  let duplicate_count = 0;
  let skipped_invalid_count = 0;
  const errors: string[] = [];

  for (const item of items) {
    const key = adapter.dedupeKeyFromRaw(item);
    if (!key) {
      skipped_invalid_count += 1;
      continue;
    }
    if (existing.has(key)) {
      duplicate_count += 1;
      continue;
    }

    const n = adapter.normalize(item, importedAt);
    if (!n) {
      skipped_invalid_count += 1;
      continue;
    }

    const rawPayload: Record<string, unknown> = {
      import_external_id: key,
      imported_at: importedAt,
    };
    if (source === "reddit") {
      rawPayload.reddit_listing = item;
    } else {
      rawPayload.github_issue = item;
    }

    const { error: insErr } = await supabase.from("scraped_leads").insert({
      user_id: user.id,
      source,
      raw_data: rawPayload,
      processed: false,
    });
    if (insErr) {
      errors.push(insErr.message);
      skipped_invalid_count += 1;
      continue;
    }
    scraped_staged_count += 1;
    existing.add(key);
  }

  const { data: prof } = await supabase.from("profiles").select("tech_stack, niches, skills").eq("id", user.id).maybeSingle();
  const profile = {
    tech_stack: Array.isArray(prof?.tech_stack) ? (prof!.tech_stack as string[]) : [],
    niches: Array.isArray(prof?.niches) ? (prof!.niches as string[]) : [],
    skills: Array.isArray(prof?.skills) ? (prof!.skills as string[]) : [],
  };

  const proc = await processScrapedLeads(supabase, user.id, { profile });
  if (proc.errors.length) {
    errors.push(...proc.errors.slice(0, 5));
  }

  const failedForMetrics = skipped_invalid_count + errors.length;
  await recordLeadImportBatchMetrics(supabase, user.id, {
    provider: source,
    fetched: items.length,
    staged: scraped_staged_count,
    imported: proc.promoted,
    duplicates: duplicate_count,
    failed: failedForMetrics,
  });

  for (const p of ["/leads", "/pipeline", "/dashboard", "/integrations", "/integrations/scraped", "/analytics"]) {
    revalidatePath(p);
  }

  return {
    ok: true,
    source,
    fetched_count: items.length,
    scraped_staged_count,
    duplicate_count,
    skipped_invalid_count,
    promoted_count: proc.promoted,
    skipped_irrelevant_count: proc.skipped_irrelevant,
    skipped_persist_failed_count: proc.skipped_persist_failed,
    errors,
  };
}
