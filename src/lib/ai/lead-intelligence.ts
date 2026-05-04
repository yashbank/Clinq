import { computeLeadScore, type LeadScoreInput } from "@/lib/ai/lead-score";

export type LeadTier = "high-value" | "standard" | "low-signal" | "time-waster";

export type LeadIntelligence = {
  score: number;
  confidence: number;
  tier: LeadTier;
  flags: string[];
  proposalStrategyHint: string;
};

type AnalyzeInput = LeadScoreInput & {
  projectTitle?: string | null;
  projectDescription?: string | null;
  projectUrl?: string | null;
  platform?: string | null;
};

function deriveBriefQuality(description: string): number {
  const len = description.trim().length;
  if (len > 400) return 5;
  if (len > 200) return 4;
  if (len > 80) return 3;
  if (len > 30) return 2;
  return 1;
}

/**
 * Heuristic lead intelligence: scoring + confidence + tier + risk flags.
 * Complements numeric `computeLeadScore` with text/URL signals.
 */
export function analyzeLead(input: AnalyzeInput): LeadIntelligence {
  const desc = `${input.projectTitle ?? ""} ${input.projectDescription ?? ""}`.toLowerCase();
  const url = (input.projectUrl ?? "").toLowerCase();
  const combined = `${desc} ${url}`;

  const flags: string[] = [];

  if (/pay\s*(outside|off)|telegram|whatsapp\s*only|crypto\s*only|western\s*union|gift\s*card/i.test(combined)) {
    flags.push("risk: off-platform or suspicious payment language");
  }
  if (/\b(test\s*task|free\s*work|unpaid\s*sample)\b/i.test(combined)) {
    flags.push("risk: unpaid trial language");
  }
  if (/\b(asap|urgent|needed\s*today|eod|within\s*24\s*h)\b/i.test(combined)) {
    flags.push("signal: urgent timeline");
  }

  const budget = Math.max(0, Number(input.budget) || 0);
  if (budget > 0 && budget < 250 && /(full|complete)\s*(app|website|platform|saas)/i.test(combined)) {
    flags.push("risk: budget likely misaligned with scope");
  }
  if (budget === 0 && desc.length < 40) {
    flags.push("signal: thin brief, no budget");
  }

  const pq =
    input.projectQuality !== undefined
      ? Math.min(5, Math.max(1, input.projectQuality))
      : deriveBriefQuality(input.projectDescription ?? "");

  const baseInput: LeadScoreInput = {
    ...input,
    projectQuality: pq,
  };

  let score = computeLeadScore(baseInput);

  for (const f of flags) {
    if (f.startsWith("risk:")) score = Math.max(0, score - 18);
    if (f.includes("unpaid trial")) score = Math.max(0, score - 12);
  }
  if (flags.some((f) => f.includes("off-platform"))) {
    score = Math.max(0, score - 22);
  }
  if (flags.includes("signal: urgent timeline")) {
    score = Math.min(100, score + 4);
  }

  let tier: LeadTier = "standard";
  if (score <= 30 || flags.filter((f) => f.startsWith("risk:")).length >= 2) {
    tier = "time-waster";
  } else if (score < 48) {
    tier = "low-signal";
  } else if (score >= 78 && !flags.some((f) => f.startsWith("risk:"))) {
    tier = "high-value";
  }

  let confidence = 38;
  if (budget > 0) confidence += 14;
  if ((input.projectDescription ?? "").trim().length > 120) confidence += 22;
  else if ((input.projectDescription ?? "").trim().length > 40) confidence += 12;
  if ((input.projectTitle ?? "").trim().length > 3) confidence += 8;
  if ((input.projectUrl ?? "").trim().length > 8) confidence += 8;
  if ((input.clientHistory ?? "").trim().length > 40) confidence += 6;
  if ((input.proposalMatchNotes ?? "").trim().length > 20) confidence += 4;
  confidence = Math.min(100, Math.round(confidence));

  const proposalStrategyHint =
    tier === "high-value"
      ? "Lead with specificity: tie 2–3 past outcomes to their stack and timeline; propose a short discovery call."
      : tier === "time-waster"
        ? "Deprioritize or qualify hard: confirm budget, scope, and decision owner before investing proposal time."
        : tier === "low-signal"
          ? "Ask 3 clarifying questions (scope, budget, success criteria) before drafting a long proposal."
          : "Standard pursuit: structured proposal with phased estimate and one clear CTA.";

  return { score, confidence, tier, flags, proposalStrategyHint };
}

export function intelligenceFromMetadata(meta: Record<string, unknown> | null | undefined): Partial<LeadIntelligence> {
  if (!meta || typeof meta !== "object") return {};
  return {
    confidence: typeof meta.confidence === "number" ? meta.confidence : undefined,
    tier: typeof meta.lead_tier === "string" ? (meta.lead_tier as LeadTier) : undefined,
    flags: Array.isArray(meta.flags) ? (meta.flags as string[]) : undefined,
    proposalStrategyHint: typeof meta.proposal_strategy_hint === "string" ? meta.proposal_strategy_hint : undefined,
  };
}
