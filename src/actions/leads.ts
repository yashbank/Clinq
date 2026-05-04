"use server";

import { revalidatePath } from "next/cache";

import { analyzeLead } from "@/lib/ai/lead-intelligence";
import { deriveLeadWorkflowSignals } from "@/lib/ai/lead-workflow";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { normalizePlatformLabel, type LeadSource } from "@/lib/leads/platforms";

import type { LeadRow, PipelineStage } from "@/types/database";

export type CreateLeadInput = {
  client_name: string;
  project_title?: string;
  project_url?: string;
  source?: LeadSource;
  platform?: string;
  project_description?: string;
  budget?: number;
  email?: string;
  phone?: string;
  company?: string;
  repeat_hire?: boolean;
  competition_level?: number;
  project_quality?: number;
  client_history?: string;
  proposal_match_notes?: string;
};

function briefQualityFromLength(description: string | null | undefined): number {
  const len = (description ?? "").trim().length;
  if (len > 400) return 5;
  if (len > 200) return 4;
  if (len > 80) return 3;
  if (len > 30) return 2;
  return 1;
}

export async function createLeadAction(input: CreateLeadInput): Promise<{ ok: true; lead: LeadRow } | { ok: false; error: string }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Unauthorized" };
  }

  const source = input.source ?? normalizePlatformLabel(input.platform);
  const projectQuality =
    input.project_quality !== undefined && input.project_quality !== null
      ? Math.min(5, Math.max(1, input.project_quality))
      : briefQualityFromLength(input.project_description);

  const intel = analyzeLead({
    budget: input.budget ?? null,
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

  const { data: prof } = await supabase
    .from("profiles")
    .select("tech_stack, niches, skills")
    .eq("id", user.id)
    .maybeSingle();

  const profileSnap = {
    tech_stack: Array.isArray(prof?.tech_stack) ? (prof!.tech_stack as string[]) : [],
    niches: Array.isArray(prof?.niches) ? (prof!.niches as string[]) : [],
    skills: Array.isArray(prof?.skills) ? (prof!.skills as string[]) : [],
  };

  const workflow = deriveLeadWorkflowSignals(
    intel,
    {
      projectDescription: input.project_description ?? null,
      budget: input.budget ?? null,
      company: input.company ?? null,
      repeatHire: Boolean(input.repeat_hire),
    },
    profileSnap,
  );

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
  };

  const row = {
    user_id: user.id,
    client_name: input.client_name.trim(),
    platform: input.platform?.trim() || null,
    project_description: input.project_description?.trim() || null,
    budget: input.budget ?? null,
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
  };

  const { data, error } = await supabase.from("leads").insert(row).select("*").single();
  if (error || !data) {
    return { ok: false, error: error?.message ?? "Insert failed" };
  }

  await supabase.from("activities").insert({
    user_id: user.id,
    lead_id: data.id,
    type: "lead_created",
    description: `Lead created: ${input.client_name}`,
    metadata: { score: intel.score, tier: intel.tier },
  });

  revalidatePath("/leads");
  revalidatePath("/pipeline");
  revalidatePath("/dashboard");
  return { ok: true, lead: data as LeadRow };
}

export async function updateLeadStageAction(
  leadId: string,
  stage: PipelineStage,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Unauthorized" };
  }

  const { data: updated, error } = await supabase
    .from("leads")
    .update({ stage })
    .eq("id", leadId)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();
  if (error) {
    return { ok: false, error: error.message };
  }
  if (!updated) {
    return { ok: false, error: "Lead not found or access denied" };
  }

  await supabase.from("activities").insert({
    user_id: user.id,
    lead_id: leadId,
    type: "stage_changed",
    description: `Moved to ${stage}`,
    metadata: { stage },
  });

  revalidatePath("/leads");
  revalidatePath("/pipeline");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function recalculateLeadScoreAction(leadId: string): Promise<{ ok: true; score: number } | { ok: false; error: string }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Unauthorized" };
  }

  const { data: lead, error: fetchErr } = await supabase
    .from("leads")
    .select("*")
    .eq("id", leadId)
    .eq("user_id", user.id)
    .single();
  if (fetchErr || !lead) {
    return { ok: false, error: fetchErr?.message ?? "Not found" };
  }

  const meta = (lead.metadata && typeof lead.metadata === "object" ? lead.metadata : {}) as Record<
    string,
    unknown
  >;

  const intel = analyzeLead({
    budget: lead.budget,
    repeatHire: lead.repeat_hire,
    competitionLevel: lead.competition_level,
    projectQuality: lead.project_quality,
    clientHistory: lead.client_history,
    proposalMatchNotes: lead.proposal_match_notes,
    projectTitle: typeof meta.project_title === "string" ? meta.project_title : null,
    projectDescription: lead.project_description,
    projectUrl: typeof meta.project_url === "string" ? meta.project_url : null,
    platform: lead.platform,
  });

  const { data: prof } = await supabase
    .from("profiles")
    .select("tech_stack, niches, skills")
    .eq("id", user.id)
    .maybeSingle();

  const profileSnap = {
    tech_stack: Array.isArray(prof?.tech_stack) ? (prof!.tech_stack as string[]) : [],
    niches: Array.isArray(prof?.niches) ? (prof!.niches as string[]) : [],
    skills: Array.isArray(prof?.skills) ? (prof!.skills as string[]) : [],
  };

  const workflow = deriveLeadWorkflowSignals(
    intel,
    {
      projectDescription: lead.project_description,
      budget: lead.budget,
      company: lead.company,
      repeatHire: lead.repeat_hire,
    },
    profileSnap,
  );

  const nextMetadata = {
    ...meta,
    confidence: intel.confidence,
    lead_tier: intel.tier,
    flags: intel.flags,
    proposal_strategy_hint: intel.proposalStrategyHint,
    scam_risk_score: workflow.scam_risk_score,
    scam_risk_label: workflow.scam_risk_label,
    seriousness_score: workflow.seriousness_score,
    portfolio_angle_suggestion: workflow.portfolio_angle_suggestion,
  };

  const { data: updatedScore, error } = await supabase
    .from("leads")
    .update({ score: intel.score, metadata: nextMetadata })
    .eq("id", leadId)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();
  if (error) {
    return { ok: false, error: error.message };
  }
  if (!updatedScore) {
    return { ok: false, error: "Lead not found or access denied" };
  }

  revalidatePath("/leads");
  revalidatePath("/pipeline");
  return { ok: true, score: intel.score };
}
