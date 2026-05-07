"use server";

import { revalidatePath } from "next/cache";

import { normalizeScrapedPayload, rawTitleHint } from "@/lib/leads/normalize-scraped-payload";
import { insertLeadWithIntelligence } from "@/lib/leads/persist-new-lead";
import {
  computeScrapedRelevanceV2,
  formatRelevanceSkipReason,
  wasScrapedRowAlreadyPromoteEligible,
} from "@/lib/leads/scraped-relevance-v2";
import { loadFreelancerProfileForAi } from "@/lib/profile/load-for-ai";
import { assessProfileCompleteness, profileCompletenessGateMessage } from "@/lib/profile/profile-completeness";
import { detectScrapedLeadsRelevanceScoreSupport } from "@/lib/scraped-leads/relevance-column";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { LeadRow } from "@/types/database";

const REVAL_SCRAPED = ["/leads", "/pipeline", "/dashboard", "/integrations", "/integrations/scraped", "/analytics"] as const;

function revalidateScrapedSurface() {
  for (const p of REVAL_SCRAPED) {
    revalidatePath(p);
  }
}

export async function dismissScrapedLeadAction(
  scrapedId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Unauthorized" };
  }

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("scraped_leads")
    .update({
      processed: true,
      dismissed_at: now,
      skip_reason: "Dismissed",
    })
    .eq("id", scrapedId)
    .eq("user_id", user.id);

  if (error) {
    return { ok: false, error: error.message };
  }
  revalidateScrapedSurface();
  return { ok: true };
}

export async function dismissScrapedLeadsBulkAction(
  scrapedIds: string[],
): Promise<{ ok: true; count: number } | { ok: false; error: string }> {
  const ids = [...new Set(scrapedIds)].filter((x) => typeof x === "string" && x.length > 0).slice(0, 50);
  if (!ids.length) {
    return { ok: false, error: "No rows selected" };
  }
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Unauthorized" };
  }
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("scraped_leads")
    .update({
      processed: true,
      dismissed_at: now,
      skip_reason: "Dismissed",
    })
    .in("id", ids)
    .eq("user_id", user.id)
    .select("id");
  if (error) {
    return { ok: false, error: error.message };
  }
  const count = data?.length ?? 0;
  revalidateScrapedSurface();
  return { ok: true, count };
}

export async function promoteScrapedLeadsBulkAction(
  scrapedIds: string[],
): Promise<{ ok: true; promoted: number; errors: string[] } | { ok: false; error: string }> {
  const ids = [...new Set(scrapedIds)].filter((x) => typeof x === "string" && x.length > 0).slice(0, 50);
  if (!ids.length) {
    return { ok: false, error: "No rows selected" };
  }
  const errors: string[] = [];
  let promoted = 0;
  for (const id of ids) {
    const res = await promoteScrapedLeadManuallyAction(id);
    if (res.ok) promoted += 1;
    else errors.push(res.error);
  }
  return { ok: true, promoted, errors };
}

export async function promoteScrapedLeadManuallyAction(
  scrapedId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
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

  const { data: row, error } = await supabase
    .from("scraped_leads")
    .select("id, raw_data, source, dismissed_at")
    .eq("id", scrapedId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !row) {
    return { ok: false, error: error?.message ?? "Row not found" };
  }
  if (row.dismissed_at) {
    return { ok: false, error: "This row was dismissed." };
  }

  const raw = row.raw_data && typeof row.raw_data === "object" && !Array.isArray(row.raw_data) ? (row.raw_data as Record<string, unknown>) : {};
  const ext = raw.import_external_id;
  if (typeof ext === "string" && ext.length > 0) {
    const { data: dup } = await supabase
      .from("leads")
      .select("id")
      .eq("user_id", user.id)
      .eq("metadata->>import_external_id", ext)
      .is("deleted_at", null)
      .is("archived_at", null)
      .maybeSingle();
    if (dup?.id) {
      return { ok: false, error: "A lead with this external id already exists." };
    }
  }

  const importedAt = typeof raw.imported_at === "string" ? raw.imported_at : new Date().toISOString();
  const normalized = normalizeScrapedPayload(row.source, raw, importedAt);
  if (!normalized) {
    return { ok: false, error: "Could not normalize this scraped row." };
  }

  const profile = {
    tech_stack: profFull?.tech_stack ?? [],
    niches: profFull?.niches ?? [],
    skills: profFull?.skills ?? [],
  };

  const ins = await insertLeadWithIntelligence(supabase, user.id, normalized.input, {
    profile,
    metadataExtra: {
      ...(normalized.metadataExtra as Record<string, unknown>),
      clinq_promotion_source: "manual_scrape_review",
    },
    revalidatePaths: ["/leads", "/pipeline", "/dashboard", "/integrations/scraped", "/analytics"],
  });
  if (!ins.ok) {
    return { ok: false, error: ins.error };
  }

  const supportsRelevance = await detectScrapedLeadsRelevanceScoreSupport(supabase);
  const promotePatch: Record<string, unknown> = {
    processed: true,
    dismissed_at: null,
    skip_reason: "Manually promoted to Leads",
  };
  if (supportsRelevance) promotePatch.relevance_score = 100;
  await supabase.from("scraped_leads").update(promotePatch).eq("id", scrapedId).eq("user_id", user.id);

  revalidateScrapedSurface();

  return { ok: true };
}

function syntheticLeadForScrapeMatch(
  input: import("@/lib/leads/create-lead-input").CreateLeadInput,
  metadataExtra: Record<string, unknown>,
): LeadRow {
  const meta = {
    ...metadataExtra,
    project_title: input.project_title ?? null,
    project_url: input.project_url ?? null,
    source: input.source ?? "other",
  };
  return {
    id: "00000000-0000-0000-0000-000000000001",
    user_id: "00000000-0000-0000-0000-000000000002",
    client_name: input.client_name,
    platform: input.platform ?? null,
    project_description: input.project_description ?? null,
    budget: input.budget ?? null,
    score: 55,
    stage: "saved",
    email: null,
    phone: null,
    company: input.company ?? null,
    repeat_hire: Boolean(input.repeat_hire),
    competition_level: input.competition_level ?? 2,
    project_quality: input.project_quality ?? 3,
    client_history: input.client_history ?? null,
    proposal_match_notes: input.proposal_match_notes ?? null,
    metadata: meta as Record<string, unknown>,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  } as LeadRow;
}

function shortSummaryFromNormalized(
  normalized: { input: import("@/lib/leads/create-lead-input").CreateLeadInput } | null,
  rawTitle: string,
): string {
  if (normalized) {
    const t = (normalized.input.project_title ?? "").trim();
    if (t.length > 0) return t.slice(0, 160);
    const d = (normalized.input.project_description ?? "").replace(/\s+/g, " ").trim();
    if (d.length > 0) return d.slice(0, 160);
  }
  return rawTitle.slice(0, 160) || "—";
}

export type RecomputeScrapedResult =
  | {
      ok: true;
      reevaluated: number;
      newlyQualifyingIds: string[];
      skipped: number;
    }
  | { ok: false; error: string };

/**
 * Re-run deterministic relevance on scraped rows in the current view (no fake counts).
 */
export async function recomputeScrapedRelevanceAction(scrapedIds: string[]): Promise<RecomputeScrapedResult> {
  const ids = [...new Set(scrapedIds)].filter((x) => typeof x === "string" && x.length > 0).slice(0, 100);
  if (!ids.length) {
    return { ok: false, error: "No rows to recompute" };
  }

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

  const profile = {
    tech_stack: Array.isArray(profFull?.tech_stack) ? (profFull!.tech_stack as string[]) : [],
    niches: Array.isArray(profFull?.niches) ? (profFull!.niches as string[]) : [],
    skills: Array.isArray(profFull?.skills) ? (profFull!.skills as string[]) : [],
  };

  const supportsRelevance = await detectScrapedLeadsRelevanceScoreSupport(supabase);

  let reevaluated = 0;
  let skipped = 0;
  const newlyQualifyingIds: string[] = [];

  for (const scrapedId of ids) {
    const { data: row, error } = supportsRelevance
      ? await supabase
          .from("scraped_leads")
          .select("id, raw_data, source, processed, dismissed_at, skip_reason, relevance_score")
          .eq("id", scrapedId)
          .eq("user_id", user.id)
          .maybeSingle()
      : await supabase
          .from("scraped_leads")
          .select("id, raw_data, source, processed, dismissed_at, skip_reason")
          .eq("id", scrapedId)
          .eq("user_id", user.id)
          .maybeSingle();

    if (error || !row) {
      skipped += 1;
      continue;
    }
    if (row.dismissed_at) {
      skipped += 1;
      continue;
    }
    const sr = (row.skip_reason ?? "").toLowerCase();
    if (sr.includes("promoted to leads") || sr.includes("manually promoted")) {
      skipped += 1;
      continue;
    }

    const raw =
      row.raw_data && typeof row.raw_data === "object" && !Array.isArray(row.raw_data)
        ? (row.raw_data as Record<string, unknown>)
        : {};
    const importedAt = typeof raw.imported_at === "string" ? raw.imported_at : new Date().toISOString();
    const hint = rawTitleHint(row.source, raw);
    const normalized = normalizeScrapedPayload(row.source, raw, importedAt);
    if (!normalized) {
      skipped += 1;
      continue;
    }

    const ext = raw.import_external_id;
    if (typeof ext === "string" && ext.length > 0) {
      const { data: dup } = await supabase
        .from("leads")
        .select("id")
        .eq("user_id", user.id)
        .eq("metadata->>import_external_id", ext)
        .is("deleted_at", null)
        .is("archived_at", null)
        .maybeSingle();
      if (dup?.id) {
        skipped += 1;
        continue;
      }
    }

    const summary = shortSummaryFromNormalized(normalized, hint);
    const synth = syntheticLeadForScrapeMatch(normalized.input, normalized.metadataExtra as Record<string, unknown>);
    const rel = computeScrapedRelevanceV2({
      input: normalized.input,
      profile,
      metadataExtra: normalized.metadataExtra as Record<string, unknown>,
      synth,
      source: row.source,
    });

    const relScorePre =
      supportsRelevance &&
      "relevance_score" in row &&
      typeof (row as { relevance_score?: unknown }).relevance_score === "number" &&
      Number.isFinite((row as { relevance_score: number }).relevance_score)
        ? (row as { relevance_score: number }).relevance_score
        : null;
    const alreadyEligible = wasScrapedRowAlreadyPromoteEligible({
      relevanceScore: relScorePre,
      skipReason: row.skip_reason,
      supportsRelevance,
    });

    const patch: Record<string, unknown> = { short_summary: summary };
    if (supportsRelevance) patch.relevance_score = rel.score;
    if (row.processed) {
      patch.skip_reason = rel.promote ? `Eligible (relevance ${rel.score}) — use Promote` : formatRelevanceSkipReason(rel);
    }

    const { error: upErr } = await supabase.from("scraped_leads").update(patch).eq("id", scrapedId).eq("user_id", user.id);
    if (upErr) {
      skipped += 1;
      continue;
    }

    reevaluated += 1;
    if (rel.promote && !alreadyEligible) {
      newlyQualifyingIds.push(scrapedId);
    }
  }

  revalidateScrapedSurface();
  return { ok: true, reevaluated, newlyQualifyingIds, skipped };
}
