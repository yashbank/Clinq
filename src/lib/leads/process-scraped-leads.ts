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
/** Listing tags + profile terms must clear this aggregate score. */
const MIN_KEYWORD_SCORE = 8;

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

/** Weighted keyword / tag overlap (tags count more than generic profile tokens). */
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

/** Stricter title alignment: multiple word hits or a substantive skill phrase in the title. */
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

type ScrapedRow = {
  id: string;
  raw_data: Record<string, unknown>;
  source: string;
};

export async function processScrapedLeads(
  supabase: SupabaseClient,
  userId: string,
  options?: { profile?: ProfileSnap | null },
): Promise<{ promoted: number; skipped: number; errors: string[] }> {
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
    return { promoted: 0, skipped: 0, errors: [error.message] };
  }

  let promoted = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const row of (rows ?? []) as ScrapedRow[]) {
    const raw = row.raw_data && typeof row.raw_data === "object" ? row.raw_data : {};
    const importedAt = typeof raw.imported_at === "string" ? raw.imported_at : new Date().toISOString();
    const freelancerProject = raw.freelancer_project;

    const normalized =
      row.source === "freelancer" && freelancerProject != null
        ? normalizeFreelancerProject(freelancerProject, importedAt)
        : null;

    if (!normalized) {
      logLeadPromotion("skip_unnormalizable", { userId, scrapedId: row.id, source: row.source }, "warn");
      await supabase.from("scraped_leads").update({ processed: true }).eq("id", row.id).eq("user_id", userId);
      skipped += 1;
      continue;
    }

    const synth = syntheticLeadForMatch(normalized.input, normalized.metadataExtra as Record<string, unknown>);
    const gates = evaluatePromotionGates(normalized.input, profSnap, normalized.metadataExtra as Record<string, unknown>, synth);

    if (!gates.ok) {
      logLeadPromotion("skip_gate", {
        userId,
        scrapedId: row.id,
        reason: gates.reason,
        client: normalized.input.client_name,
        keywordScore: keywordRelevanceScore(
          normalized.input,
          profSnap,
          importTagsFromMetadata(normalized.metadataExtra as Record<string, unknown>),
        ),
      });
      skipped += 1;
      await supabase.from("scraped_leads").update({ processed: true }).eq("id", row.id).eq("user_id", userId);
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
      await supabase.from("scraped_leads").update({ processed: true }).eq("id", row.id).eq("user_id", userId);
      skipped += 1;
      continue;
    }

    promoted += 1;
    logLeadPromotion("promoted", { userId, scrapedId: row.id, leadId: ins.lead.id, client: normalized.input.client_name });
    await supabase.from("scraped_leads").update({ processed: true }).eq("id", row.id).eq("user_id", userId);
  }

  logLeadPromotion("batch_complete", { userId, promoted, skipped, errorCount: errors.length });
  return { promoted, skipped, errors };
}
