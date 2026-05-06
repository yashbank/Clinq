import { assessProfileCompleteness } from "@/lib/profile/profile-completeness";
import type { FreelancerProfileFields } from "@/types/profile";

function profile(p: Partial<FreelancerProfileFields>): FreelancerProfileFields {
  return {
    preferred_currency: "USD",
    display_name: null,
    bio: null,
    website_url: null,
    resume_text: null,
    resume_filename: null,
    skills: [],
    tech_stack: [],
    portfolio_links: [],
    linkedin_url: null,
    github_url: null,
    experience_level: null,
    niches: [],
    profile_onboarding_completed_at: null,
    profile_intelligence: null,
    ...p,
  };
}

describe("assessProfileCompleteness", () => {
  it("fails proposal AI without bio, skills, and tech/niche", () => {
    const a = assessProfileCompleteness(
      profile({
        bio: "short",
        skills: ["a"],
        tech_stack: [],
        niches: [],
        resume_text: null,
        portfolio_links: [],
      }),
    );
    expect(a.passesProposalAi).toBe(false);
    expect(a.missing.length).toBeGreaterThan(0);
  });

  it("passes proposal AI with bio, two skills, and two tech tags", () => {
    const a = assessProfileCompleteness(
      profile({
        bio: "x".repeat(40),
        skills: ["React", "Node"],
        tech_stack: ["TypeScript", "PostgreSQL"],
        niches: [],
        portfolio_links: ["https://example.com/p"],
      }),
    );
    expect(a.passesProposalAi).toBe(true);
  });
});
