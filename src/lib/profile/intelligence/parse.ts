import type { ProfileIntelligenceV1 } from "@/types/profile-intelligence";

export function parseStoredProfileIntelligence(raw: unknown): ProfileIntelligenceV1 | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as ProfileIntelligenceV1;
  if (o.version !== 1) return null;
  if (typeof o.updatedAt !== "string") return null;
  if (!Array.isArray(o.normalizedSkills) || !Array.isArray(o.strengths) || !Array.isArray(o.inferredNiches)) {
    return null;
  }
  if (typeof o.profileQualityScore !== "number") return null;
  return o;
}
