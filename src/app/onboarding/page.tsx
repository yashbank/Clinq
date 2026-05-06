import { redirect } from "next/navigation";

import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { parseStoredProfileIntelligence } from "@/lib/profile/intelligence/parse";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { FreelancerProfileFields } from "@/types/profile";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ force?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: row, error } = await supabase
    .from("profiles")
    .select(
      "preferred_currency, display_name, bio, website_url, resume_text, resume_filename, skills, tech_stack, portfolio_links, linkedin_url, github_url, experience_level, niches, profile_onboarding_completed_at, profile_intelligence",
    )
    .eq("id", user.id)
    .single();

  if (error || !row) {
    return (
      <div className="gradient-mesh flex min-h-[100dvh] flex-col items-center justify-center p-8 text-center">
        <p className="max-w-md text-sm text-muted-foreground">
          Could not load profile ({error?.message ?? "unknown"}).
        </p>
      </div>
    );
  }

  if (row.profile_onboarding_completed_at && sp.force !== "1") {
    redirect("/dashboard");
  }

  const initial: FreelancerProfileFields = {
    preferred_currency: typeof row.preferred_currency === "string" ? row.preferred_currency : "USD",
    display_name: row.display_name ?? null,
    bio: typeof row.bio === "string" ? row.bio : null,
    website_url: typeof row.website_url === "string" ? row.website_url : null,
    resume_text: row.resume_text ?? null,
    resume_filename: row.resume_filename ?? null,
    skills: Array.isArray(row.skills) ? (row.skills as string[]) : [],
    tech_stack: Array.isArray(row.tech_stack) ? (row.tech_stack as string[]) : [],
    portfolio_links: Array.isArray(row.portfolio_links) ? (row.portfolio_links as string[]) : [],
    linkedin_url: row.linkedin_url ?? null,
    github_url: row.github_url ?? null,
    experience_level: row.experience_level ?? null,
    niches: Array.isArray(row.niches) ? (row.niches as string[]) : [],
    profile_onboarding_completed_at: row.profile_onboarding_completed_at ?? null,
    profile_intelligence: parseStoredProfileIntelligence(row.profile_intelligence),
  };

  return (
    <div className="gradient-mesh min-h-[100dvh] bg-background">
      <OnboardingWizard initial={initial} />
    </div>
  );
}
