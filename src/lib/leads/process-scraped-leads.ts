import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { CreateLeadInput } from "@/lib/leads/create-lead-input";
import { logLeadPromotion } from "@/lib/logging/app-log";
import { normalizeScrapedPayload, rawTitleHint } from "@/lib/leads/normalize-scraped-payload";
import { insertLeadWithIntelligence } from "@/lib/leads/persist-new-lead";
import { computeScrapedRelevanceV2, formatRelevanceSkipReason } from "@/lib/leads/scraped-relevance-v2";
import { assertProfileReadyForCuratedLeadAi } from "@/lib/profile/profile-gate";
import { detectScrapedLeadsRelevanceScoreSupport } from "@/lib/scraped-leads/relevance-column";
import type { LeadRow } from "@/types/database";

type ProfileSnap = {
  skills: string[];
  niches: string[];
  tech_stack: string[];
};

export type ProcessScrapedLeadsResult = {
  promoted: number;
  skipped_irrelevant: number;
  skipped_invalid: number;
  skipped_persist_failed: number;
  errors: string[];
  skip_reason_counts: Record<string, number>;
};

function syntheticLeadForMatch(input: CreateLeadInput, metadataExtra: Record<string, unknown>): LeadRow {
  const meta = {
    ...(metadataExtra as Record<string, unknown>),
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

function shortSummaryForScraped(normalized: { input: CreateLeadInput } | null, rawTitle: string): string {
  if (normalized) {
    const t = (normalized.input.project_title ?? "").trim();
    if (t.length > 0) return t.slice(0, 160);
    const d = (normalized.input.project_description ?? "").replace(/\s+/g, " ").trim();
    if (d.length > 0) return d.slice(0, 160);
  }
  return rawTitle.slice(0, 160) || "—";
}

type ScrapedRow = {
  id: string;
  raw_data: Record<string, unknown>;
  source: string;
};

export async function processScrapedLeads(
  supabase: SupabaseClient,
  userId: string,
  options?: { profile?: ProfileSnap | null },
): Promise<ProcessScrapedLeadsResult> {
  const gate = await assertProfileReadyForCuratedLeadAi(supabase, userId);
  if (!gate.ok) {
    return {
      promoted: 0,
      skipped_irrelevant: 0,
      skipped_invalid: 0,
      skipped_persist_failed: 0,
      errors: [gate.message],
      skip_reason_counts: {},
    };
  }

  let profile = options?.profile;
  if (profile === undefined) {
    const { data: prof } = await supabase.from("profiles").select("tech_stack, niches, skills").eq("id", userId).maybeSingle();
    profile = {
      tech_stack: Array.isArray(prof?.tech_stack) ? (prof!.tech_stack as string[]) : [],
      niches: Array.isArray(prof?.niches) ? (prof!.niches as string[]) : [],
      skills: Array.isArray(prof?.skills) ? (prof!.skills as string[]) : [],
    };
  }
  const profSnap = profile ?? { tech_stack: [], niches: [], skills: [] };

  const supportsRelevanceScore = await detectScrapedLeadsRelevanceScoreSupport(supabase);

  const { data: rows, error } = await supabase
    .from("scraped_leads")
    .select("id, raw_data, source")
    .eq("user_id", userId)
    .eq("processed", false)
    .is("dismissed_at", null)
    .order("created_at", { ascending: true })
    .limit(100);

  if (error) {
    logLeadPromotion("batch_query_failed", { userId, message: error.message }, "error");
    return {
      promoted: 0,
      skipped_irrelevant: 0,
      skipped_invalid: 0,
      skipped_persist_failed: 0,
      errors: [error.message],
      skip_reason_counts: {},
    };
  }

  let promoted = 0;
  let skipped_irrelevant = 0;
  let skipped_invalid = 0;
  let skipped_persist_failed = 0;
  const errors: string[] = [];
  const skip_reason_counts: Record<string, number> = {};

  for (const row of (rows ?? []) as ScrapedRow[]) {
    const raw = row.raw_data && typeof row.raw_data === "object" ? row.raw_data : {};
    const importedAt = typeof raw.imported_at === "string" ? raw.imported_at : new Date().toISOString();
    const hint = rawTitleHint(row.source, raw);

    const normalized = normalizeScrapedPayload(row.source, raw, importedAt);

    if (!normalized) {
      logLeadPromotion("skip_unnormalizable", { userId, scrapedId: row.id, source: row.source }, "warn");
      skipped_invalid += 1;
      const invalidPatch: Record<string, unknown> = {
        processed: true,
        skip_reason: "Invalid or incomplete payload for this source",
        short_summary: hint.slice(0, 160) || "—",
      };
      if (supportsRelevanceScore) invalidPatch.relevance_score = null;
      await supabase.from("scraped_leads").update(invalidPatch).eq("id", row.id).eq("user_id", userId);
      continue;
    }

    const summary = shortSummaryForScraped(normalized, hint);
    const synth = syntheticLeadForMatch(normalized.input, normalized.metadataExtra as Record<string, unknown>);
    const rel = computeScrapedRelevanceV2({
      input: normalized.input,
      profile: profSnap,
      metadataExtra: normalized.metadataExtra as Record<string, unknown>,
      synth,
      source: row.source,
    });

    if (!rel.promote) {
      const bucket = rel.score >= 40 ? "relevance_mid" : "relevance_low";
      skip_reason_counts[bucket] = (skip_reason_counts[bucket] ?? 0) + 1;
      logLeadPromotion("skip_relevance_v2", {
        userId,
        scrapedId: row.id,
        source: row.source,
        score: rel.score,
        breakdown: rel.breakdown,
      });
      skipped_irrelevant += 1;
      const skipPatch: Record<string, unknown> = {
        processed: true,
        skip_reason: formatRelevanceSkipReason(rel),
        short_summary: summary,
      };
      if (supportsRelevanceScore) skipPatch.relevance_score = rel.score;
      await supabase.from("scraped_leads").update(skipPatch).eq("id", row.id).eq("user_id", userId);
      continue;
    }

    const ins = await insertLeadWithIntelligence(supabase, userId, normalized.input, {
      profile: profSnap,
      metadataExtra: normalized.metadataExtra,
      revalidatePaths: [],
    });
    if (!ins.ok) {
      logLeadPromotion("insert_failed", { userId, scrapedId: row.id, error: ins.error, client: normalized.input.client_name }, "error");
      errors.push(ins.error);
      skipped_persist_failed += 1;
      const failPatch: Record<string, unknown> = {
        processed: true,
        skip_reason: `Could not save lead: ${ins.error.slice(0, 200)}`,
        short_summary: summary,
      };
      if (supportsRelevanceScore) failPatch.relevance_score = rel.score;
      await supabase.from("scraped_leads").update(failPatch).eq("id", row.id).eq("user_id", userId);
      continue;
    }

    promoted += 1;
    logLeadPromotion("promoted", { userId, scrapedId: row.id, leadId: ins.lead.id, client: normalized.input.client_name, score: rel.score });
    const okPatch: Record<string, unknown> = {
      processed: true,
      skip_reason: `Promoted to Leads (relevance ${rel.score})`,
      short_summary: summary,
    };
    if (supportsRelevanceScore) okPatch.relevance_score = rel.score;
    await supabase.from("scraped_leads").update(okPatch).eq("id", row.id).eq("user_id", userId);
  }

  logLeadPromotion("batch_complete", {
    userId,
    promoted,
    skipped_irrelevant,
    skipped_invalid,
    skipped_persist_failed,
    errorCount: errors.length,
    skip_reason_counts,
  });

  return { promoted, skipped_irrelevant, skipped_invalid, skipped_persist_failed, errors, skip_reason_counts };
}
