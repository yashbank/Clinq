import { mergeResumeExtractionIntoProfileUpdate } from "@/lib/profile/merge-resume-into-profile";
import type { ParsedResumeAdvanced } from "@/lib/profile/parse-resume-advanced";
import type { FreelancerProfileFields } from "@/types/profile";

const emptyProfile: FreelancerProfileFields = {
  preferred_currency: "USD",
  display_name: null,
  bio: "too short",
  website_url: null,
  resume_text: null,
  resume_filename: null,
  skills: ["React"],
  tech_stack: ["JS"],
  portfolio_links: [],
  linkedin_url: null,
  github_url: null,
  experience_level: null,
  niches: [],
  profile_onboarding_completed_at: null,
  profile_intelligence: null,
};

const parsed: ParsedResumeAdvanced = {
  skills: ["React", "GraphQL"],
  experience: [],
  projects: [],
  tech_stack: ["Node"],
  niche_suggestions: ["SaaS"],
  summary_suggestion: "Experienced full-stack engineer with focus on APIs.",
  headline_suggestion: "Senior Engineer",
  linkedin_url: null,
  github_url: null,
  other_urls: [],
  years_experience_hint: 5,
};

describe("mergeResumeExtractionIntoProfileUpdate", () => {
  it("unions skills without duplicates", () => {
    const patch = mergeResumeExtractionIntoProfileUpdate(emptyProfile, parsed);
    expect(patch).not.toBeNull();
    expect((patch!.skills as string[]).map((s) => s.toLowerCase())).toEqual(
      expect.arrayContaining(["react", "graphql"]),
    );
  });

  it("returns null when nothing would change", () => {
    const full: FreelancerProfileFields = {
      ...emptyProfile,
      bio: "x".repeat(200),
      skills: ["React", "GraphQL"],
      tech_stack: ["Node", "JS"],
      niches: ["SaaS"],
      display_name: "Senior Engineer",
      experience_level: "senior",
    };
    const patch = mergeResumeExtractionIntoProfileUpdate(full, { ...parsed, skills: ["React"], tech_stack: ["Node"] });
    expect(patch).toBeNull();
  });
});
