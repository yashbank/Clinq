import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

import { generateShortLeadDescription } from "@/lib/ai/short-lead-description";
import { analyzeLead } from "@/lib/ai/lead-intelligence";
import { buildLeadIntelligenceRecord } from "@/lib/ai/lead-intelligence-pipeline";
import { deriveLeadWorkflowSignals } from "@/lib/ai/lead-workflow";
import type { CreateLeadInput } from "@/lib/leads/create-lead-input";
import { resolveLeadBudgetColumnsFromImportMetadata } from "@/lib/currency/lead-budget-columns";
import { normalizePlatformLabel } from "@/lib/leads/platforms";

import type { LeadRow } from "@/types/database";

type ProfileSnap = {
  tech_stack: string[];
  niches: string[];
  skills: string[];
};

function briefQualityFromLength(description: string | null | undefined): number {
  const len = (description ?? "").trim().length;
  if (len > 400) return 5;
  if (len > 200) return 4;
  if (len > 80) return 3;
  if (len > 30) return 2;
  return 1;
}

async function loadProfileSnap(supabase: SupabaseClient, userId: string): Promise<ProfileSnap> {
  const { data: prof } = await supabase.from("profiles").select("tech_stack, niches, skills").eq("id", userId).maybeSingle();
  return {
    tech_stack: Array.isArray(prof?.tech_stack) ? (prof!.tech_stack as string[]) : [],
    niches: Array.isArray(prof?.niches) ? (prof!.niches as string[]) : [],
    skills: Array.isArray(prof?.skills) ? (prof!.skills as string[]) : [],
  };
}

/**
 * Inserts one lead with the same intelligence pipeline as manual create.
 * Use from server actions with the caller's Supabase client (user JWT).
 */
export async function insertLeadWithIntelligence(
  supabase: SupabaseClient,
  userId: string,
  input: CreateLeadInput,
  options?: {
    profile?: ProfileSnap | null;
    skipActivity?: boolean;
    /** Merged into metadata after core scoring fields (e.g. import ids, raw snapshot refs). */
    metadataExtra?: Record<string, unknown>;
    /** Cached extractive summary; avoids empty column when migration adds `short_description`. */
    shortDescription?: string | null;
    /** If omitted, revalidates leads, pipeline, dashboard. Pass [] to skip. */
    revalidatePaths?: string[] | null;
  },
): Promise<{ ok: true; lead: LeadRow } | { ok: false; error: string }> {
  const source = input.source ?? normalizePlatformLabel(input.platform);
  const projectQuality =
    input.project_quality !== undefined && input.project_quality !== null
      ? Math.min(5, Math.max(1, input.project_quality))
      : briefQualityFromLength(input.project_description);

  const budgetCols = await resolveLeadBudgetColumnsFromImportMetadata(
    options?.metadataExtra as Record<string, unknown> | undefined,
  );
  const budgetForIntel = input.budget ?? budgetCols.budget_avg ?? null;

  const intel = analyzeLead({
    budget: budgetForIntel,
    repeatHire: Boolean(input.repeat_hire),
    competitionLevel: input.competition_level ?? 2,
    projectQuality,
    clientHistory: input.client_history ?? null,
    proposalMatchNotes: input.proposal_match_notes ?? null,
    projectTitle: input.project_title ?? null,
    projectDescription: input.project_description ?? null,
    projectUrl: input.project_url ?? null,
    platform: input.platform ?? null,
  });

  const profileSnap = options?.profile !== undefined ? options.profile ?? { tech_stack: [], niches: [], skills: [] } : await loadProfileSnap(supabase, userId);

  const workflow = deriveLeadWorkflowSignals(
    intel,
    {
      projectDescription: input.project_description ?? null,
      budget: budgetForIntel,
      company: input.company ?? null,
      repeatHire: Boolean(input.repeat_hire),
    },
    profileSnap,
  );

  const profileTokens = [...profileSnap.skills, ...profileSnap.tech_stack, ...profileSnap.niches]
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 80);

  const intelligence = buildLeadIntelligenceRecord({
    intel,
    workflow: {
      scam_risk_score: workflow.scam_risk_score,
      scam_risk_label: workflow.scam_risk_label,
      seriousness_score: workflow.seriousness_score,
      portfolio_angle_suggestion: workflow.portfolio_angle_suggestion,
    },
    scoreInput: {
      budget: budgetForIntel,
      repeatHire: Boolean(input.repeat_hire),
      competitionLevel: input.competition_level ?? 2,
      projectQuality,
      clientHistory: input.client_history ?? null,
      proposalMatchNotes: input.proposal_match_notes ?? null,
    },
    projectTitle: input.project_title ?? null,
    projectDescription: input.project_description ?? null,
    projectUrl: input.project_url ?? null,
    company: input.company ?? null,
    profileTokens,
  });

  const metadata = {
    project_title: input.project_title?.trim() || null,
    project_url: input.project_url?.trim() || null,
    source,
    confidence: intel.confidence,
    lead_tier: intel.tier,
    flags: intel.flags,
    proposal_strategy_hint: intel.proposalStrategyHint,
    scam_risk_score: workflow.scam_risk_score,
    scam_risk_label: workflow.scam_risk_label,
    seriousness_score: workflow.seriousness_score,
    portfolio_angle_suggestion: workflow.portfolio_angle_suggestion,
    ...(options?.metadataExtra ?? {}),
  };

  const shortDescRaw = (options?.shortDescription?.trim() || generateShortLeadDescription(input.project_description ?? "")).trim();
  const short_description = shortDescRaw.length > 0 ? shortDescRaw : null;

  const resolvedBudget = budgetForIntel;

  const row = {
    user_id: userId,
    client_name: input.client_name.trim(),
    platform: input.platform?.trim() || null,
    project_description: input.project_description?.trim() || null,
    short_description,
    budget: resolvedBudget,
    budget_min: budgetCols.budget_min,
    budget_max: budgetCols.budget_max,
    budget_avg: budgetCols.budget_avg,
    currency_original: budgetCols.currency_original,
    budget_usd: budgetCols.budget_usd,
    score: intel.score,
    email: input.email?.trim() || null,
    phone: input.phone?.trim() || null,
    company: input.company?.trim() || null,
    repeat_hire: Boolean(input.repeat_hire),
    competition_level: input.competition_level ?? 2,
    project_quality: projectQuality,
    client_history: input.client_history?.trim() || null,
    proposal_match_notes: input.proposal_match_notes?.trim() || null,
    metadata,
    intelligence: intelligence as unknown as Record<string, unknown>,
  };

  const { data, error } = await supabase.from("leads").insert(row).select("*").single();
  if (error || !data) {
    return { ok: false, error: error?.message ?? "Insert failed" };
  }

  if (!options?.skipActivity) {
    await supabase.from("activities").insert({
      user_id: userId,
      lead_id: data.id,
      type: "lead_created",
      description: `Lead created: ${input.client_name}`,
      metadata: { score: intel.score, tier: intel.tier },
    });
  }

  const paths = options?.revalidatePaths === null ? [] : (options?.revalidatePaths ?? ["/leads", "/pipeline", "/dashboard"]);
  for (const p of paths) {
    revalidatePath(p);
  }

  return { ok: true, lead: data as LeadRow };
}
