import type { FreelancerProfileFields } from "@/types/profile";

/** Deterministic readiness for curated lead promotion and proposal AI. */
export function evaluateProfileLeadAiReadiness(profile: FreelancerProfileFields): {
  ready: boolean;
  gaps: string[];
  score: number;
} {
  const gaps: string[] = [];
  const bioOk = (profile.bio ?? "").trim().length >= 40 || (profile.resume_text ?? "").trim().length >= 200;
  if (!bioOk) gaps.push("a fuller bio or resume text");

  const skillsOk = (profile.skills ?? []).filter(Boolean).length >= 2;
  if (!skillsOk) gaps.push("at least two skills");

  const stackOk =
    (profile.tech_stack ?? []).filter(Boolean).length >= 2 || (profile.niches ?? []).filter(Boolean).length >= 1;
  if (!stackOk) gaps.push("tech stack entries or at least one niche");

  const linksOk =
    (profile.portfolio_links ?? []).some((u) => typeof u === "string" && u.trim().length > 5) ||
    (profile.github_url ?? "").trim().length > 8 ||
    (profile.linkedin_url ?? "").trim().length > 8 ||
    (profile.website_url ?? "").trim().length > 8 ||
    (profile.resume_text ?? "").trim().length >= 120;
  if (!linksOk) gaps.push("a portfolio, GitHub, LinkedIn, or website link (or longer resume text)");

  const parts = [bioOk, skillsOk, stackOk, linksOk];
  const score = Math.round((parts.filter(Boolean).length / parts.length) * 100);
  return { ready: gaps.length === 0, gaps, score };
}
