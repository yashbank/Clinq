import type { ProfileIntelligenceSource, ProfileIntelligenceV1 } from "@/types/profile-intelligence";

function strArr(v: unknown, max: number): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((x): x is string => typeof x === "string")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, max);
}

function strField(v: unknown, fallback: string): string {
  return typeof v === "string" && v.trim().length > 0 ? v.trim() : fallback;
}

function numField(v: unknown, fallback: number): number {
  return typeof v === "number" && Number.isFinite(v) ? Math.min(100, Math.max(0, v)) : fallback;
}

function sourceField(v: unknown): ProfileIntelligenceSource {
  return v === "heuristic" || v === "openai" || v === "merged" ? v : "heuristic";
}

/** Accepts partially invalid DB JSON and returns a safe v1 object or null when unusable. */
export function parseStoredProfileIntelligence(raw: unknown): ProfileIntelligenceV1 | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (o.version !== 1) return null;

  const normalizedSkills = strArr(o.normalizedSkills, 40);
  const strengthsRaw = strArr(o.strengths, 12);
  const inferredNiches = strArr(o.inferredNiches, 12);
  const updatedAt = typeof o.updatedAt === "string" && o.updatedAt.length > 0 ? o.updatedAt : new Date().toISOString();

  return {
    version: 1,
    updatedAt,
    source: sourceField(o.source),
    normalizedSkills,
    strengths: strengthsRaw.length
      ? strengthsRaw
      : ["Profile intelligence was recovered from stored data—recompute when your profile is ready."],
    inferredNiches,
    seniorityHint: typeof o.seniorityHint === "string" && o.seniorityHint.trim() ? o.seniorityHint.trim() : null,
    proposalToneHint: strField(o.proposalToneHint, "professional"),
    idealProjectSummary: strField(o.idealProjectSummary, "Well-scoped projects with clear requirements."),
    positioningLine: strField(o.positioningLine, "Freelancer"),
    profileQualityScore: numField(o.profileQualityScore, 10),
    ...(strArr(o.missingSkillHints, 8).length ? { missingSkillHints: strArr(o.missingSkillHints, 8) } : {}),
    ...(strArr(o.proposalPositioningNotes, 6).length ? { proposalPositioningNotes: strArr(o.proposalPositioningNotes, 6) } : {}),
    ...(strArr(o.idealClientNotes, 5).length ? { idealClientNotes: strArr(o.idealClientNotes, 5) } : {}),
  };
}
