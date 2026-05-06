import { parseStoredLeadIntelligence } from "@/lib/ai/parse-stored-lead-intelligence";
import { getCompetitionDifficultyScore, hoursSinceLeadActivity } from "@/lib/ai/lead-ranking-base";
import { computeLeadRankingV3Score, titleProfileOverlapPct, type LeadRankingV3Options } from "@/lib/ai/lead-ranking-v3";
import type { LeadRow } from "@/types/database";

export { budgetQualityScore, getCompetitionDifficultyScore, hoursSinceLeadActivity, recencyScore } from "@/lib/ai/lead-ranking-base";

export type LeadPriorityContext = {
  /** 0–100 overlap from profile vs brief (optional, from `computeLeadFreelancerMatch`). */
  skillMatchPct?: number;
  nicheMatchPct?: number;
  effectiveBudgetUsd?: number | null;
  /** Normalized profile tokens for title overlap (optional). */
  profileTokens?: string[];
  hasProposal?: boolean;
};

export type LeadPriorityOptions = LeadPriorityContext &
  Pick<LeadRankingV3Options, "feedbackSummary" | "openFollowUpCount">;

/**
 * Weighted 0–100 priority (V3): deterministic fit, score, recency, budget, source, signals.
 */
export function computeLeadPriorityScore(lead: LeadRow, options?: LeadPriorityOptions | null): number {
  return computeLeadRankingV3Score(lead, {
    skillMatchPct: options?.skillMatchPct,
    nicheMatchPct: options?.nicheMatchPct,
    effectiveBudgetUsd: options?.effectiveBudgetUsd,
    profileTokens: options?.profileTokens,
    hasProposal: options?.hasProposal,
    feedbackSummary: options?.feedbackSummary,
    openFollowUpCount: options?.openFollowUpCount,
  });
}

/**
 * Single short deterministic line for UI (no AI).
 */
export function generatePriorityReason(lead: LeadRow, context?: LeadPriorityContext): string {
  if (lead.interest_status === "not_interested") {
    return "Marked not interested — ranked lower.";
  }

  const meta =
    lead.metadata && typeof lead.metadata === "object" && !Array.isArray(lead.metadata) ? (lead.metadata as Record<string, unknown>) : {};
  if (meta.clinq_promotion_source === "manual_scrape_review") {
    return "Manually promoted import — higher trust in fit.";
  }

  const intel = parseStoredLeadIntelligence(lead.intelligence);
  const portfolioMatch = typeof intel?.signals?.portfolioMatchScore === "number" ? intel.signals.portfolioMatchScore : null;
  const skillPct = context?.skillMatchPct;
  const nichePct = context?.nicheMatchPct;
  const titlePct =
    context?.profileTokens && context.profileTokens.length > 0
      ? titleProfileOverlapPct(lead, context.profileTokens)
      : null;

  const diff = getCompetitionDifficultyScore(lead);
  const hours = hoursSinceLeadActivity(lead);
  const score = Number(lead.score) || 0;
  const usd = context?.effectiveBudgetUsd;

  if (lead.interest_status === "interested") {
    return "Marked interested — kept near the top.";
  }

  if ((skillPct != null && skillPct >= 42) || (portfolioMatch != null && portfolioMatch >= 52)) {
    return "Skill or portfolio signal aligns with the brief.";
  }
  if (titlePct != null && titlePct >= 38) {
    return "Title overlaps your profile tags.";
  }
  if (nichePct != null && nichePct >= 40) {
    return "Niche overlap with the posting.";
  }
  if (usd != null && usd >= 2500 && diff <= 48) {
    return "Clear budget in a lighter-competition band.";
  }
  if (hours <= 72 && score >= 64) {
    return "Recent activity with a workable score.";
  }
  if (lead.repeat_hire) {
    return "Repeat-hire client on file.";
  }
  if (score >= 82) {
    return "High Clinq score for this brief.";
  }
  if (diff <= 36) {
    return "Competition signal is on the lighter side.";
  }
  if (usd != null && usd >= 800 && score >= 58) {
    return "Budget resolved in USD with a mid+ score.";
  }
  return "No single standout signal — review the brief.";
}
