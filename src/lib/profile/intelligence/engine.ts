import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { enrichProfileIntelligenceWithOpenAi } from "@/lib/profile/intelligence/openai-enrich";
import { buildHeuristicProfileIntelligence } from "@/lib/profile/intelligence/heuristics";
import { loadFreelancerProfileForAi } from "@/lib/profile/load-for-ai";
import type { ProfileIntelligenceV1 } from "@/types/profile-intelligence";

export { parseStoredProfileIntelligence } from "@/lib/profile/intelligence/parse";

export async function runProfileIntelligencePipeline(
  supabase: SupabaseClient,
  userId: string,
  options?: { useOpenAi?: boolean },
): Promise<ProfileIntelligenceV1> {
  const profile = await loadFreelancerProfileForAi(supabase, userId);
  if (!profile) {
    return {
      version: 1,
      updatedAt: new Date().toISOString(),
      source: "heuristic",
      normalizedSkills: [],
      strengths: ["Complete your profile to unlock richer intelligence."],
      inferredNiches: [],
      seniorityHint: null,
      proposalToneHint: "professional",
      idealProjectSummary: "Well-scoped projects with documented requirements.",
      positioningLine: "Freelancer profile incomplete.",
      profileQualityScore: 5,
    };
  }

  const base = buildHeuristicProfileIntelligence(profile);
  const useOpenAi = options?.useOpenAi !== false;

  let merged: ProfileIntelligenceV1 = { ...base, source: "heuristic" };
  if (useOpenAi) {
    const ai = await enrichProfileIntelligenceWithOpenAi(base, profile);
    if (ai) {
      merged = {
        ...base,
        ...ai,
        source: "merged",
        normalizedSkills: base.normalizedSkills,
        seniorityHint: base.seniorityHint,
        profileQualityScore: base.profileQualityScore,
        version: 1,
        updatedAt: new Date().toISOString(),
      };
    }
  }

  await supabase
    .from("profiles")
    .update({
      profile_intelligence: merged as unknown as Record<string, unknown>,
      profile_intelligence_updated_at: merged.updatedAt,
    })
    .eq("id", userId);

  return merged;
}
