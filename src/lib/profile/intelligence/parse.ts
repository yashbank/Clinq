import type { ProfileIntelligenceSource } from "@/types/profile-intelligence";
import type { ProfileIntelligenceV1 } from "@/types/profile-intelligence";

function cleanStringArray(v: unknown, maxLen: number, maxItems: number): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((x): x is string => typeof x === "string")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => s.slice(0, maxLen))
    .slice(0, maxItems);
}

function safeStr(v: unknown, max: number, fallback: string): string {
  if (typeof v !== "string") return fallback;
  const t = v.trim();
  if (!t) return fallback;
  return t.slice(0, max);
}

function safeSource(v: unknown): ProfileIntelligenceSource {
  if (v === "heuristic" || v === "openai" || v === "merged") return v;
  return "heuristic";
}

/**
 * Parses stored JSON from `profiles.profile_intelligence`, tolerating null-ish legacy fields.
 */
export function parseStoredProfileIntelligence(raw: unknown): ProfileIntelligenceV1 | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (o.version !== 1) return null;

  const updatedAt = typeof o.updatedAt === "string" && o.updatedAt.trim() ? o.updatedAt : new Date().toISOString();
  const normalizedSkills = cleanStringArray(o.normalizedSkills, 80, 40);
  let strengths = cleanStringArray(o.strengths, 400, 8);
  if (strengths.length === 0) strengths = ["Add more resume detail and explicit skills to strengthen positioning."];
  const inferredNiches = cleanStringArray(o.inferredNiches, 80, 12);

  const seniorityRaw = o.seniorityHint;
  const seniorityHint =
    seniorityRaw === null || seniorityRaw === undefined
      ? null
      : typeof seniorityRaw === "string" && ["junior", "mid", "senior", "lead"].includes(seniorityRaw.trim())
        ? (seniorityRaw.trim() as "junior" | "mid" | "senior" | "lead")
        : null;

  const proposalToneHint = safeStr(o.proposalToneHint, 600, "professional: structured, specific, one strong CTA.");
  const idealProjectSummary = safeStr(
    o.idealProjectSummary,
    600,
    "Projects where scope, budget, and stakeholders are documented early.",
  );
  const positioningLine = safeStr(o.positioningLine, 400, "Freelancer profile.");

  const profileQualityScore =
    typeof o.profileQualityScore === "number" && Number.isFinite(o.profileQualityScore)
      ? Math.min(100, Math.max(0, o.profileQualityScore))
      : 0;

  const out: ProfileIntelligenceV1 = {
    version: 1,
    updatedAt,
    source: safeSource(o.source),
    normalizedSkills,
    strengths,
    inferredNiches,
    seniorityHint,
    proposalToneHint,
    idealProjectSummary,
    positioningLine,
    profileQualityScore,
  };

  const missing = cleanStringArray(o.missingSkillHints, 400, 6);
  if (missing.length) out.missingSkillHints = missing;
  const posNotes = cleanStringArray(o.proposalPositioningNotes, 400, 5);
  if (posNotes.length) out.proposalPositioningNotes = posNotes;
  const idealNotes = cleanStringArray(o.idealClientNotes, 400, 4);
  if (idealNotes.length) out.idealClientNotes = idealNotes;

  return out;
}
