import type { SupabaseClient } from "@supabase/supabase-js";

import { parseStoredProfileIntelligence } from "@/lib/profile/intelligence/parse";
import type { FreelancerProfileFields } from "@/types/profile";

export async function loadFreelancerProfileForAi(
  supabase: SupabaseClient,
  userId: string,
): Promise<FreelancerProfileFields | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "preferred_currency, display_name, bio, website_url, resume_text, resume_filename, skills, tech_stack, portfolio_links, linkedin_url, github_url, experience_level, niches, profile_onboarding_completed_at, profile_intelligence",
    )
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return {
    preferred_currency: typeof data.preferred_currency === "string" ? data.preferred_currency : "USD",
    display_name: data.display_name ?? null,
    bio: typeof data.bio === "string" ? data.bio : null,
    website_url: typeof data.website_url === "string" ? data.website_url : null,
    resume_text: data.resume_text ?? null,
    resume_filename: data.resume_filename ?? null,
    skills: Array.isArray(data.skills)
      ? (data.skills as unknown[]).filter((x): x is string => typeof x === "string").map((s) => s.trim()).filter(Boolean)
      : [],
    tech_stack: Array.isArray(data.tech_stack)
      ? (data.tech_stack as unknown[]).filter((x): x is string => typeof x === "string").map((s) => s.trim()).filter(Boolean)
      : [],
    portfolio_links: Array.isArray(data.portfolio_links)
      ? (data.portfolio_links as unknown[]).filter((x): x is string => typeof x === "string").map((s) => s.trim()).filter(Boolean)
      : [],
    linkedin_url: typeof data.linkedin_url === "string" ? data.linkedin_url : null,
    github_url: typeof data.github_url === "string" ? data.github_url : null,
    experience_level: data.experience_level ?? null,
    niches: Array.isArray(data.niches) ? (data.niches as string[]) : [],
    profile_onboarding_completed_at: data.profile_onboarding_completed_at ?? null,
    profile_intelligence: parseStoredProfileIntelligence(data.profile_intelligence),
  };
}
