"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { analyzeLead } from "@/lib/ai/lead-intelligence";
import { buildLeadIntelligenceRecord } from "@/lib/ai/lead-intelligence-pipeline";
import { deriveLeadWorkflowSignals } from "@/lib/ai/lead-workflow";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { CreateLeadInput } from "@/lib/leads/create-lead-input";
import { insertLeadWithIntelligence } from "@/lib/leads/persist-new-lead";

import { tokenizeLeadText, tokenOverlap } from "@/lib/leads/interest-similarity";
import type { LeadInterestStatus, LeadRow, PipelineStage } from "@/types/database";

const uuid = z.string().uuid();

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

async function bumpSimilarityDemotionForPeers(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId: string,
  subject: LeadRow,
): Promise<void> {
  const subjectTokens = tokenizeLeadText(subject);
  if (subjectTokens.size === 0) return;

  const { data: peers } = await supabase
    .from("leads")
    .select("id, client_name, company, platform, project_description, proposal_match_notes, metadata, similarity_demotion")
    .eq("user_id", userId)
    .neq("id", subject.id)
    .is("deleted_at", null)
    .is("archived_at", null);

  for (const p of peers ?? []) {
    const row = p as LeadRow;
    const overlap = tokenOverlap(subjectTokens, tokenizeLeadText(row));
    if (overlap < 2) continue;
    const bump = Math.min(15, overlap * 5);
    const cur = row.similarity_demotion ?? 0;
    const next = Math.min(50, cur + bump);
    if (next <= cur) continue;
    await supabase.from("leads").update({ similarity_demotion: next }).eq("id", row.id).eq("user_id", userId);
  }
}

export async function updateLeadInterestAction(
  leadId: string,
  status: LeadInterestStatus | null,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const id = uuid.safeParse(leadId);
  if (!id.success) return { ok: false, error: "Invalid lead" };

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Unauthorized" };

  const { data: lead, error: fe } = await supabase.from("leads").select("*").eq("id", id.data).eq("user_id", user.id).maybeSingle();
  if (fe || !lead) return { ok: false, error: fe?.message ?? "Not found" };

  const { error } = await supabase.from("leads").update({ interest_status: status }).eq("id", id.data).eq("user_id", user.id);
  if (error) return { ok: false, error: error.message };

  if (status === "not_interested") {
    await bumpSimilarityDemotionForPeers(supabase, user.id, lead as LeadRow);
  }

  revalidatePath("/leads");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function archiveLeadAction(leadId: string, archived: boolean): Promise<{ ok: true } | { ok: false; error: string }> {
  const id = uuid.safeParse(leadId);
  if (!id.success) return { ok: false, error: "Invalid lead" };

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Unauthorized" };

  const patch = archived ? { archived_at: new Date().toISOString() } : { archived_at: null as string | null };
  const { error } = await supabase.from("leads").update(patch).eq("id", id.data).eq("user_id", user.id).is("deleted_at", null);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/leads");
  revalidatePath("/pipeline");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function keepOnlyPotentialLeadsAction(): Promise<{ ok: true; moved: number } | { ok: false; error: string }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Unauthorized" };

  const { data: rows, error } = await supabase
    .from("leads")
    .select("*")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .is("archived_at", null);

  if (error) return { ok: false, error: error.message };

  let moved = 0;
  for (const row of rows ?? []) {
    const r = row as LeadRow;
    const keep = r.score >= 60 || r.interest_status === "interested";
    if (keep) continue;

    const { error: insErr } = await supabase.from("scraped_leads").insert({
      user_id: user.id,
      source: "prune",
      raw_data: { former_lead: row, pruned_at: new Date().toISOString(), reason: "keep_only_potential" },
      processed: true,
    });
    if (insErr) {
      return { ok: false, error: insErr.message };
    }

    const { error: delErr } = await supabase
      .from("leads")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", r.id)
      .eq("user_id", user.id);
    if (delErr) {
      return { ok: false, error: delErr.message };
    }
    moved += 1;
  }

  revalidatePath("/leads");
  revalidatePath("/pipeline");
  revalidatePath("/dashboard");
  return { ok: true, moved };
}

export async function softDeleteLeadAction(leadId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const id = uuid.safeParse(leadId);
  if (!id.success) return { ok: false, error: "Invalid lead" };

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Unauthorized" };

  const { error } = await supabase
    .from("leads")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id.data)
    .eq("user_id", user.id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/leads");
  revalidatePath("/pipeline");
  revalidatePath("/dashboard");
  return { ok: true };
}
