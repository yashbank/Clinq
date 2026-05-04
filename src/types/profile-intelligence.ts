export type ProfileIntelligenceSource = "heuristic" | "openai" | "merged";

/** Versioned blob stored in profiles.profile_intelligence */
export type ProfileIntelligenceV1 = {
  version: 1;
  updatedAt: string;
  source: ProfileIntelligenceSource;
  normalizedSkills: string[];
  strengths: string[];
  inferredNiches: string[];
  seniorityHint: string | null;
  proposalToneHint: string;
  idealProjectSummary: string;
  positioningLine: string;
  profileQualityScore: number;
  /** Gaps between resume tokens and saved skills — only concrete tokens, no generic courses. */
  missingSkillHints?: string[];
  /** How to angle proposals given niches + seniority (short bullets). */
  proposalPositioningNotes?: string[];
  /** Ideal client sketch from stated niches and experience—conservative. */
  idealClientNotes?: string[];
};
