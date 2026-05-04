"use server";

import { revalidatePath } from "next/cache";

import { computeLeadScore } from "@/lib/ai/lead-score";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import type { LeadRow, PipelineStage } from "@/types/database";

export type CreateLeadInput = {
  client_name: string;
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

export async function createLeadAction(input: CreateLeadInput): Promise<{ ok: true; lead: LeadRow } | { ok: false; error: string }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Unauthorized" };
  }

  const score = computeLeadScore({
    budget: input.budget ?? null,
    repeatHire: Boolean(input.repeat_hire),
    competitionLevel: input.competition_level ?? 2,
    projectQuality: input.project_quality ?? 3,
    clientHistory: input.client_history ?? null,
    proposalMatchNotes: input.proposal_match_notes ?? null,
  });

  const row = {
    user_id: user.id,
    client_name: input.client_name.trim(),
    platform: input.platform?.trim() || null,
    project_description: input.project_description?.trim() || null,
    budget: input.budget ?? null,
    score,
    email: input.email?.trim() || null,
    phone: input.phone?.trim() || null,
    company: input.company?.trim() || null,
    repeat_hire: Boolean(input.repeat_hire),
    competition_level: input.competition_level ?? 2,
    project_quality: input.project_quality ?? 3,
    client_history: input.client_history?.trim() || null,
    proposal_match_notes: input.proposal_match_notes?.trim() || null,
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
    metadata: { score },
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

  const score = computeLeadScore({
    budget: lead.budget,
    repeatHire: lead.repeat_hire,
    competitionLevel: lead.competition_level,
    projectQuality: lead.project_quality,
    clientHistory: lead.client_history,
    proposalMatchNotes: lead.proposal_match_notes,
  });

  const { data: updatedScore, error } = await supabase
    .from("leads")
    .update({ score })
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
  return { ok: true, score };
}
