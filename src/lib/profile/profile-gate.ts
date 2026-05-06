import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { loadFreelancerProfileForAi } from "@/lib/profile/load-for-ai";
import { evaluateProfileLeadAiReadiness } from "@/lib/profile/profile-completeness";

export type ProfileLeadAiGateResult = { ok: true } | { ok: false; message: string; gaps: string[] };

export async function assertProfileReadyForCuratedLeadAi(
  supabase: SupabaseClient,
  userId: string,
): Promise<ProfileLeadAiGateResult> {
  const profile = await loadFreelancerProfileForAi(supabase, userId);
  if (!profile) {
    return {
      ok: false,
      message: "Profile could not be loaded. Complete your profile in Settings.",
      gaps: ["profile"],
    };
  }
  const { ready, gaps } = evaluateProfileLeadAiReadiness(profile);
  if (ready) return { ok: true };
  return {
    ok: false,
    message: `Strengthen your profile to use curated imports and AI proposals: ${gaps.join(" · ")}.`,
    gaps,
  };
}
