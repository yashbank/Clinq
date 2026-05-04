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
};
