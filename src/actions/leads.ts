"use server";

import { revalidatePath } from "next/cache";

import { analyzeLead } from "@/lib/ai/lead-intelligence";
import { buildLeadIntelligenceRecord } from "@/lib/ai/lead-intelligence-pipeline";
import { deriveLeadWorkflowSignals } from "@/lib/ai/lead-workflow";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { CreateLeadInput } from "@/lib/leads/create-lead-input";
import { insertLeadWithIntelligence } from "@/lib/leads/persist-new-lead";

import type { LeadRow, PipelineStage } from "@/types/database";

export async function createLeadAction(input: CreateLeadInput): Promise<{ ok: true; lead: LeadRow } | { ok: false; error: string }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Unauthorized" };
  }

  return insertLeadWithIntelligence(supabase, user.id, input);
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

  const profileTokens = [
    ...profileSnap.skills,
    ...profileSnap.tech_stack,
    ...profileSnap.niches,
  ]
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
      budget: lead.budget,
      repeatHire: lead.repeat_hire,
      competitionLevel: lead.competition_level,
      projectQuality: lead.project_quality,
      clientHistory: lead.client_history,
      proposalMatchNotes: lead.proposal_match_notes,
    },
    projectTitle: typeof meta.project_title === "string" ? meta.project_title : null,
    projectDescription: lead.project_description,
    projectUrl: typeof meta.project_url === "string" ? meta.project_url : null,
    company: lead.company,
    profileTokens,
  });

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
    .update({
      score: intel.score,
      metadata: nextMetadata,
      intelligence: intelligence as unknown as Record<string, unknown>,
    })
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
