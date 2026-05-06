import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Sidebar } from "@/components/dashboard/sidebar";
import { TopNavbar } from "@/components/dashboard/top-navbar";
import { FloatingAIOrb } from "@/components/dashboard/floating-ai-orb";
import { FreelancerProfileForm } from "@/components/profile/freelancer-profile-form";
import { ProfileIntelligencePanel } from "@/components/profile/profile-intelligence-panel";
import { formatWorkspaceLoadError } from "@/lib/errors/format-user-error";
import { parseStoredProfileIntelligence } from "@/lib/profile/intelligence/parse";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { FreelancerProfileFields } from "@/types/profile";

export const metadata: Metadata = {
  title: "Profile",
};

export default async function ProfilePage() {
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
      <div className="gradient-mesh flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
        <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
          {formatWorkspaceLoadError("your profile", error?.message ?? null)}
        </p>
        <Link
          href="/login"
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          Back to sign in
        </Link>
      </div>
    );
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
    <div className="gradient-mesh flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <TopNavbar title="Freelancer profile" subtitle="Feeds lead scoring and proposal personalization" />
        <main className="flex-1 overflow-y-auto p-3 pb-8 sm:p-6">
          <div className="mx-auto max-w-2xl">
            <ProfileIntelligencePanel intelligence={initial.profile_intelligence} />
            <FreelancerProfileForm initial={initial} />
          </div>
        </main>
      </div>
      <FloatingAIOrb />
    </div>
  );
}
