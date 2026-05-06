import type { FreelancerProfileFields } from "@/types/profile";

export type ProfileCompletenessAssessment = {
  /** 0–100 deterministic score. */
  score: number;
  /** Curated imports / promote-to-lead / public ingest. */
  passesCuratedLeadWorkflow: boolean;
  /** AI proposal generation. */
  passesProposalAi: boolean;
  /** Short labels for UI. */
  missing: string[];
};

function countLinks(p: FreelancerProfileFields): number {
  const urls = [p.website_url, p.linkedin_url, p.github_url, ...(p.portfolio_links ?? [])].filter(
    (x) => typeof x === "string" && x.trim().length >= 8,
  );
  return urls.length;
}

/**
 * Smooth gating: browsing always allowed; AI-heavy flows check these flags server-side.
 */
export function assessProfileCompleteness(profile: FreelancerProfileFields | null): ProfileCompletenessAssessment {
  const missing: string[] = [];
  if (!profile) {
    return {
      score: 0,
      passesCuratedLeadWorkflow: false,
      passesProposalAi: false,
      missing: ["Sign in and save a profile."],
    };
  }

  const bio = (profile.bio ?? "").trim();
  const resume = (profile.resume_text ?? "").trim();
  const hasHeadlineOrSummary = bio.length >= 36 || resume.length >= 180;
  if (!hasHeadlineOrSummary) {
    missing.push("Add a bio (a few sentences) or upload a resume with enough text for context.");
  }

  const skills = (profile.skills ?? []).filter((s) => s.trim().length > 0);
  const tech = (profile.tech_stack ?? []).filter((s) => s.trim().length > 0);
  const niches = (profile.niches ?? []).filter((s) => s.trim().length > 0);
  const hasSkills = skills.length >= 2;
  const hasTechOrNiches = tech.length >= 2 || niches.length >= 1;
  if (!hasSkills) missing.push("Add at least two skills.");
  if (!hasTechOrNiches) missing.push("Add tech stack tags or at least one niche.");

  const linkCount = countLinks(profile);
  const hasResumeContext = resume.length >= 120;
  const hasLinksOrResume = linkCount > 0 || hasResumeContext;
  if (!hasLinksOrResume) {
    missing.push("Add a portfolio, LinkedIn, GitHub, website, or a longer resume excerpt.");
  }

  let score = 0;
  if (hasHeadlineOrSummary) score += 34;
  if (hasSkills) score += 22;
  if (hasTechOrNiches) score += 22;
  if (hasLinksOrResume) score += 22;
  score = Math.min(100, score);

  const passesCuratedLeadWorkflow = hasSkills && hasTechOrNiches && hasHeadlineOrSummary && hasLinksOrResume;
  const passesProposalAi = hasHeadlineOrSummary && hasSkills && hasTechOrNiches;

  return {
    score,
    passesCuratedLeadWorkflow,
    passesProposalAi,
    missing,
  };
}

export function profileCompletenessGateMessage(a: ProfileCompletenessAssessment): string {
  if (a.missing.length === 0) return "";
  return `Complete your profile first: ${a.missing[0]}`;
}

/** Legacy name used by `profile-gate.ts` — same rules as `passesCuratedLeadWorkflow`. */
export function evaluateProfileLeadAiReadiness(profile: FreelancerProfileFields | null): {
  ready: boolean;
  gaps: string[];
} {
  const a = assessProfileCompleteness(profile);
  return { ready: a.passesCuratedLeadWorkflow, gaps: a.missing };
}
