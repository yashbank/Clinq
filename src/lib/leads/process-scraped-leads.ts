import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { CreateLeadInput } from "@/lib/leads/create-lead-input";
import { logLeadPromotion } from "@/lib/logging/app-log";
import { normalizeFreelancerProject } from "@/lib/leads/ingest/freelancer-normalize";
import { computeLeadFreelancerMatch } from "@/lib/leads/lead-freelancer-match";
import { insertLeadWithIntelligence } from "@/lib/leads/persist-new-lead";
import type { LeadRow } from "@/types/database";

type ProfileSnap = {
  skills: string[];
  niches: string[];
  tech_stack: string[];
};

const MIN_SKILL_MATCH_PCT = 35;
const MIN_KEYWORD_SCORE = 8;

export type ProcessScrapedLeadsResult = {
  promoted: number;
  /** Rows that failed relevance gates (keyword / skill / title). */
  skipped_irrelevant: number;
  /** Payload could not be normalized to a lead shape. */
  skipped_invalid: number;
  /** Lead insert failed after passing gates. */
  skipped_persist_failed: number;
  errors: string[];
  /** Counts by gate reason for logging (keyword | skill | title). */
  skip_reason_counts: Record<string, number>;
};

function syntheticLeadForMatch(input: CreateLeadInput, metadataExtra: Record<string, unknown>): LeadRow {
  const meta = {
    ...(metadataExtra as Record<string, unknown>),
    project_title: input.project_title ?? null,
    project_url: input.project_url ?? null,
    source: input.source ?? "freelancer",
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

function importTagsFromMetadata(metadataExtra: Record<string, unknown>): string[] {
  const imp = metadataExtra.import;
  if (!imp || typeof imp !== "object" || Array.isArray(imp)) return [];
  const tags = (imp as Record<string, unknown>).tags;
  if (!Array.isArray(tags)) return [];
  return tags.filter((t): t is string => typeof t === "string" && t.trim().length > 0).map((t) => t.trim());
}

function keywordRelevanceScore(input: CreateLeadInput, profile: ProfileSnap, listingTags: string[]): number {
  const hay = `${input.project_title ?? ""} ${input.project_description ?? ""}`.toLowerCase();
  const profileKeys = [...profile.skills, ...profile.tech_stack, ...profile.niches]
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.length > 2);
  const tagKeys = listingTags.map((t) => t.trim().toLowerCase()).filter((t) => t.length > 1);

  let score = 0;
  for (const k of tagKeys) {
    if (hay.includes(k)) score += 5;
  }
  const seen = new Set<string>();
  for (const k of profileKeys) {
    if (!hay.includes(k)) continue;
    if (seen.has(k)) continue;
    seen.add(k);
    score += k.length >= 6 ? 3 : 2;
  }
  return score;
}

function keywordMatchPass(input: CreateLeadInput, profile: ProfileSnap, listingTags: string[]): boolean {
  return keywordRelevanceScore(input, profile, listingTags) >= MIN_KEYWORD_SCORE;
}

function skillMatchPass(synth: LeadRow, profile: ProfileSnap): boolean {
  const { skillMatchPct } = computeLeadFreelancerMatch(synth, {
    skills: profile.skills,
    niches: profile.niches,
    techStack: profile.tech_stack,
  });
  return skillMatchPct >= MIN_SKILL_MATCH_PCT;
}

function titleRelevancePass(input: CreateLeadInput, profile: ProfileSnap): boolean {
  const title = (input.project_title ?? "").toLowerCase().trim();
  if (title.length < 8) return false;

  const profileTerms = [...profile.skills, ...profile.niches, ...profile.tech_stack]
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.length > 2);

  const profileWordSet = new Set(
    profileTerms.flatMap((s) => s.split(/\W+/).filter((w) => w.length > 2)),
  );
  const titleWords = [...new Set(title.split(/\W+/).filter((w) => w.length > 2))];
  let overlap = 0;
  for (const w of titleWords) {
    if (profileWordSet.has(w)) overlap += 1;
  }
  if (overlap >= 2) return true;

  for (const sk of [...profile.skills, ...profile.tech_stack]) {
    const s = sk.trim().toLowerCase();
    if (s.length >= 4 && title.includes(s)) return true;
  }
  return false;
}

type GateResult =
  | { ok: true }
  | { ok: false; reason: "keyword" | "skill" | "title" };

function evaluatePromotionGates(
  input: CreateLeadInput,
  profile: ProfileSnap,
  metadataExtra: Record<string, unknown>,
  synth: LeadRow,
): GateResult {
  const tags = importTagsFromMetadata(metadataExtra);
  if (!keywordMatchPass(input, profile, tags)) return { ok: false, reason: "keyword" };
  if (!skillMatchPass(synth, profile)) return { ok: false, reason: "skill" };
  if (!titleRelevancePass(input, profile)) return { ok: false, reason: "title" };
  return { ok: true };
}

function gateReasonToUserMessage(reason: "keyword" | "skill" | "title"): string {
  if (reason === "keyword") return "Low relevance (keywords / tags vs your profile)";
  if (reason === "skill") return "Low relevance (skill match below threshold)";
  return "Low relevance (title vs your profile)";
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

  const { data: rows, error } = await supabase
    .from("scraped_leads")
    .select("id, raw_data, source")
    .eq("user_id", userId)
    .eq("processed", false)
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
    const freelancerProject = raw.freelancer_project;
    const rawTitle =
      freelancerProject && typeof freelancerProject === "object" && !Array.isArray(freelancerProject)
        ? String((freelancerProject as Record<string, unknown>).title ?? "").slice(0, 200)
        : "";

    const normalized =
      row.source === "freelancer" && freelancerProject != null
        ? normalizeFreelancerProject(freelancerProject, importedAt)
        : null;

    if (!normalized) {
      logLeadPromotion("skip_unnormalizable", { userId, scrapedId: row.id, source: row.source }, "warn");
      skipped_invalid += 1;
      await supabase
        .from("scraped_leads")
        .update({
          processed: true,
          skip_reason: "Invalid or incomplete listing payload",
          short_summary: shortSummaryForScraped(null, rawTitle),
        })
        .eq("id", row.id)
        .eq("user_id", userId);
      continue;
    }

    const summary = shortSummaryForScraped(normalized, rawTitle);
    const synth = syntheticLeadForMatch(normalized.input, normalized.metadataExtra as Record<string, unknown>);
    const gates = evaluatePromotionGates(normalized.input, profSnap, normalized.metadataExtra as Record<string, unknown>, synth);

    if (!gates.ok) {
      const msg = gateReasonToUserMessage(gates.reason);
      skip_reason_counts[gates.reason] = (skip_reason_counts[gates.reason] ?? 0) + 1;
      logLeadPromotion("skip_gate", {
        userId,
        scrapedId: row.id,
        reason: gates.reason,
        keywordScore: keywordRelevanceScore(
          normalized.input,
          profSnap,
          importTagsFromMetadata(normalized.metadataExtra as Record<string, unknown>),
        ),
      });
      skipped_irrelevant += 1;
      await supabase
        .from("scraped_leads")
        .update({ processed: true, skip_reason: msg, short_summary: summary })
        .eq("id", row.id)
        .eq("user_id", userId);
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
      await supabase
        .from("scraped_leads")
        .update({
          processed: true,
          skip_reason: `Could not save lead: ${ins.error.slice(0, 200)}`,
          short_summary: summary,
        })
        .eq("id", row.id)
        .eq("user_id", userId);
      continue;
    }

    promoted += 1;
    logLeadPromotion("promoted", { userId, scrapedId: row.id, leadId: ins.lead.id, client: normalized.input.client_name });
    await supabase
      .from("scraped_leads")
      .update({ processed: true, skip_reason: "Promoted to Leads", short_summary: summary })
      .eq("id", row.id)
      .eq("user_id", userId);
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
