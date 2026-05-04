import type { FreelancerProfileFields } from "@/types/profile";

import { normalizeSkillTokens } from "@/lib/profile/intelligence/normalize-skills";
import type { ProfileIntelligenceV1 } from "@/types/profile-intelligence";

function tokenize(text: string): Set<string> {
  const s = text.toLowerCase().replace(/[^a-z0-9+#.\s-]/g, " ");
  return new Set(s.split(/\s+/).filter((w) => w.length > 2));
}

function inferSeniorityHint(level: string | null, resume: string): string | null {
  if (level && ["junior", "mid", "senior", "lead"].includes(level)) {
    return level;
  }
  const r = resume.toLowerCase();
  if (/\b(principal|staff|distinguished|head of)\b/.test(r)) return "lead";
  if (/\b(senior|sr\.|lead)\b/.test(r)) return "senior";
  if (/\b(junior|jr\.|graduate|intern)\b/.test(r)) return "junior";
  if (/\b(mid-level|intermediate)\b/.test(r)) return "mid";
  return null;
}

function inferTone(level: string | null): string {
  if (level === "lead" || level === "senior") {
    return "confident-consultative: short proof points, clear tradeoffs, decisive CTA.";
  }
  if (level === "junior") {
    return "professional-friendly: enthusiasm with humility; emphasize learning velocity and collaboration.";
  }
  return "professional: structured, specific, one strong CTA.";
}

function qualityScore(p: FreelancerProfileFields, mergedSkills: string[]): number {
  let s = 0;
  if ((p.display_name ?? "").trim().length > 1) s += 10;
  if ((p.bio ?? "").trim().length > 40) s += 12;
  if ((p.resume_text ?? "").trim().length > 200) s += 28;
  else if ((p.resume_text ?? "").trim().length > 40) s += 14;
  if (mergedSkills.length >= 6) s += 18;
  else if (mergedSkills.length >= 3) s += 10;
  if ((p.niches ?? []).length) s += 8;
  if ((p.portfolio_links ?? []).filter(Boolean).length) s += 8;
  if ((p.github_url ?? "").trim()) s += 6;
  if ((p.linkedin_url ?? "").trim()) s += 6;
  if ((p.website_url ?? "").trim()) s += 4;
  return Math.min(100, s);
}

export function buildHeuristicProfileIntelligence(profile: FreelancerProfileFields): ProfileIntelligenceV1 {
  const resume = profile.resume_text ?? "";
  const resumeTokens = tokenize(resume);
  const fromLists = normalizeSkillTokenStrings([...(profile.skills ?? []), ...(profile.tech_stack ?? [])]);
  const merged = normalizeSkillTokens([...fromLists, ...inferSkillsFromResume(resumeTokens)]);

  const niches = normalizeSkillTokens([...(profile.niches ?? [])]);
  const seniorityHint = inferSeniorityHint(profile.experience_level, resume);

  const strengths: string[] = [];
  if (merged.length >= 8) strengths.push("Broad technical surface area inferred from skills + resume tokens.");
  if ((profile.portfolio_links ?? []).length) strengths.push("Portfolio links available for proof-led proposals.");
  if (strengths.length === 0) strengths.push("Add more resume detail and explicit skills to strengthen positioning.");

  const idealProjectSummary =
    niches.length > 0
      ? `Projects aligned with: ${niches.slice(0, 5).join(", ")}.`
      : "Projects where scope, budget, and stakeholders are documented early.";

  const positioningLine =
    (profile.display_name ?? "This freelancer").trim() +
    (seniorityHint ? ` — ${seniorityHint}-level delivery.` : " — structured execution with clear communication.");

  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    source: "heuristic",
    normalizedSkills: merged.slice(0, 40),
    strengths,
    inferredNiches: niches.slice(0, 12),
    seniorityHint,
    proposalToneHint: inferTone(seniorityHint ?? profile.experience_level),
    idealProjectSummary,
    positioningLine,
    profileQualityScore: qualityScore(profile, merged),
  };
}

function normalizeSkillTokenStrings(items: string[]): string[] {
  return normalizeSkillTokens(items.map((s) => s.trim()).filter(Boolean));
}

const TECH_KEYWORDS = [
  "typescript",
  "javascript",
  "react",
  "next",
  "node",
  "python",
  "go",
  "rust",
  "java",
  "kotlin",
  "swift",
  "postgres",
  "postgresql",
  "mysql",
  "redis",
  "aws",
  "gcp",
  "azure",
  "kubernetes",
  "docker",
  "graphql",
  "sql",
  "tailwind",
  "figma",
];

function inferSkillsFromResume(tokens: Set<string>): string[] {
  const found: string[] = [];
  for (const kw of TECH_KEYWORDS) {
    if (tokens.has(kw)) found.push(kw);
  }
  return found;
}
