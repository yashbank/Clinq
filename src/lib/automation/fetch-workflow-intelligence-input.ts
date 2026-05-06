import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { WorkflowIntelligenceInput } from "@/lib/automation/workflow-intelligence";
import { mergeUsdToForeignRates } from "@/lib/currency/display-currency";
import { getUsdToForeignRates } from "@/lib/currency/exchange-rates";
import { countHighRelevanceSkippedScraped } from "@/lib/dashboard-source-signals";
import { loadFeedbackSignalsSummary } from "@/lib/opportunity/feedback-signals";

/**
 * Loads the same real signals used for dashboard “today” / workflow suggestions (bounded queries).
 */
export async function fetchWorkflowIntelligenceInput(
  supabase: SupabaseClient,
  userId: string,
  profile: { skills: unknown; tech_stack: unknown; niches: unknown } | null,
): Promise<WorkflowIntelligenceInput> {
  let usdToForeignRates: Record<string, number> | null = null;
  try {
    usdToForeignRates = mergeUsdToForeignRates(await getUsdToForeignRates());
  } catch {
    usdToForeignRates = null;
  }

  const [
    { data: leadRows },
    { data: proposalRows },
    { data: activityRows },
    { data: proposalLeadRows },
    feedbackSummary,
    scrapedSkipped,
  ] = await Promise.all([
    supabase
      .from("leads")
      .select("*")
      .eq("user_id", userId)
      .is("deleted_at", null)
      .is("archived_at", null)
      .order("updated_at", { ascending: false })
      .limit(55),
    supabase
      .from("proposals")
      .select("id, lead_id, title, created_at, evaluation")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(28),
    supabase
      .from("activities")
      .select("lead_id, created_at")
      .eq("user_id", userId)
      .not("lead_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(450),
    supabase.from("proposals").select("lead_id").eq("user_id", userId).not("lead_id", "is", null),
    loadFeedbackSignalsSummary(supabase, userId),
    countHighRelevanceSkippedScraped(supabase, userId),
  ]);

  const freelancerProfile = {
    skills: Array.isArray(profile?.skills) ? (profile!.skills as string[]) : [],
    techStack: Array.isArray(profile?.tech_stack) ? (profile!.tech_stack as string[]) : [],
    niches: Array.isArray(profile?.niches) ? (profile!.niches as string[]) : [],
  };

  const leadIdsWithProposal = new Set(
    (proposalLeadRows ?? []).map((r) => r.lead_id).filter((id): id is string => typeof id === "string" && id.length > 0),
  );

  return {
    leads: (leadRows ?? []) as WorkflowIntelligenceInput["leads"],
    proposals: (proposalRows ?? []) as WorkflowIntelligenceInput["proposals"],
    activities: (activityRows ?? []) as WorkflowIntelligenceInput["activities"],
    leadIdsWithProposal,
    feedbackSummary,
    freelancerProfile,
    usdToForeignRates,
    scrapedHighRelevanceSkipped: scrapedSkipped,
  };
}
