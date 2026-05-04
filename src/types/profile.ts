export type ExperienceLevel = "junior" | "mid" | "senior" | "lead";

/** Row slice used by proposal AI and lead workflow. */
export type FreelancerProfileFields = {
  display_name: string | null;
  resume_text: string | null;
  resume_filename: string | null;
  skills: string[];
  tech_stack: string[];
  portfolio_links: string[];
  linkedin_url: string | null;
  github_url: string | null;
  experience_level: string | null;
  niches: string[];
  profile_onboarding_completed_at: string | null;
};
