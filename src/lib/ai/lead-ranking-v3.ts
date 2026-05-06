import {
  budgetQualityScore,
  clamp,
  getCompetitionDifficultyScore,
  hoursSinceLeadActivity,
  recencyScore,
} from "@/lib/ai/lead-ranking-base";
import { canonicalLeadProjectTitle } from "@/lib/leads/canonical-lead-display";
import { feedbackPriorityDelta, type FeedbackSignalsSummary } from "@/lib/opportunity/feedback-signals";
import type { LeadRow } from "@/types/database";

export type LeadRankingV3Options = {
  feedbackSummary?: FeedbackSignalsSummary | null;
  openFollowUpCount?: number;
  /** 0–100 from `computeLeadFreelancerMatch` when available. */
  skillMatchPct?: number;
  nicheMatchPct?: number;
  /** Canonical USD when resolved (improves budget clarity). */
  effectiveBudgetUsd?: number | null;
  /** Lowercased profile tokens (skills, tech, niches). */
  profileTokens?: string[];
  /** Lead has at least one saved proposal. */
  hasProposal?: boolean;
};

function metaRecord(lead: LeadRow): Record<string, unknown> {
  return lead.metadata && typeof lead.metadata === "object" && !Array.isArray(lead.metadata)
    ? (lead.metadata as Record<string, unknown>)
    : {};
}

/** 0–100: structured budget fields score higher than legacy-only budget. */
export function budgetClaritySignal(lead: LeadRow, effectiveUsd: number | null): number {
  if (typeof lead.budget_usd === "number" && lead.budget_usd > 0 && Number.isFinite(lead.budget_usd)) {
    return 96;
  }
  const avg = typeof lead.budget_avg === "number" && lead.budget_avg > 0;
  const cur = typeof lead.currency_original === "string" && lead.currency_original.trim().length > 0;
  if (avg && cur) return 86;

  const meta = metaRecord(lead);
  const imp = meta.import && typeof meta.import === "object" && !Array.isArray(meta.import) ? (meta.import as Record<string, unknown>) : {};
  const min = typeof imp.budget_min === "number" ? imp.budget_min : null;
  const max = typeof imp.budget_max === "number" ? imp.budget_max : null;
  if (min != null && max != null && min > 0 && max > 0) return 72;

  if (effectiveUsd != null && effectiveUsd > 0) return 64;
  const leg = Number(lead.budget);
  if (leg > 0 && Number.isFinite(leg)) return 52;
  return 28;
}

/** Deterministic source / channel quality (canonical fields only). */
export function sourceQualityScore(lead: LeadRow): number {
  const meta = metaRecord(lead);
  if (meta.clinq_promotion_source === "manual_scrape_review") return 92;

  const platform = (lead.platform ?? "").trim().toLowerCase();
  if (lead.is_freelancer_channel) {
    if (platform.includes("freelancer")) return 78;
    return 74;
  }
  if (lead.is_imported_lead) {
    return 68;
  }
  if (platform.length > 0) return 80;
  return 76;
}

/** 0–100 overlap between profile tokens and canonical title. */
export function titleProfileOverlapPct(lead: LeadRow, profileTokens: string[]): number {
  if (!profileTokens.length) return 0;
  const title = canonicalLeadProjectTitle(lead).toLowerCase();
  if (!title.trim()) return 0;
  let hits = 0;
  for (const tok of profileTokens) {
    const t = tok.trim().toLowerCase();
    if (t.length < 2) continue;
    if (title.includes(t)) hits += 1;
  }
  const denom = Math.min(12, Math.max(1, profileTokens.length));
  return clamp(Math.round((hits / denom) * 100), 0, 100);
}

function weakFitPenalty(lead: LeadRow, opts: LeadRankingV3Options): number {
  const skill = opts.skillMatchPct ?? 0;
  const niche = opts.nicheMatchPct ?? 0;
  const score = Number(lead.score) || 0;
  let pen = 0;
  if (skill < 22 && niche < 20 && score < 52) pen -= 5;
  if (skill < 15 && niche < 12 && score < 44) pen -= 3;

  const hours = hoursSinceLeadActivity(lead);
  if (score < 46 && hours > 720) pen -= 3;
  return pen;
}

/**
 * Deterministic 0–100 priority score (V3): fit, lead score, recency, budget value + clarity,
 * competition ease, source quality, workflow signals, feedback aggregates.
 */
export function computeLeadRankingV3Score(lead: LeadRow, options?: LeadRankingV3Options | null): number {
  const opts = options ?? {};
  const profileTokens = (opts.profileTokens ?? []).map((s) => s.trim().toLowerCase()).filter((s) => s.length > 1);

  const effectiveUsd =
    opts.effectiveBudgetUsd != null && Number.isFinite(opts.effectiveBudgetUsd) && opts.effectiveBudgetUsd > 0
      ? opts.effectiveBudgetUsd
      : null;
  const budgetValue = budgetQualityScore(effectiveUsd ?? (Number(lead.budget) > 0 ? Number(lead.budget) : null));
  const budgetClear = budgetClaritySignal(lead, effectiveUsd);
  const budgetBlend = clamp(0.55 * budgetValue + 0.45 * budgetClear, 0, 100);

  const diff = getCompetitionDifficultyScore(lead);
  const compEase = clamp(100 - diff, 0, 100);

  const hasProfile = profileTokens.length > 0;
  const skillPart = hasProfile ? clamp(opts.skillMatchPct ?? 0, 0, 100) : 44;
  const nichePart = hasProfile ? clamp(opts.nicheMatchPct ?? 0, 0, 100) : 44;
  const titlePart = hasProfile ? titleProfileOverlapPct(lead, profileTokens) : 40;

  const fitBlend = clamp(0.55 * skillPart + 0.28 * nichePart + 0.17 * titlePart, 0, 100);

  const baseScore = clamp(Number(lead.score) || 0, 0, 100);
  const rec = recencyScore(lead);
  const src = sourceQualityScore(lead);

  let p =
    0.28 * baseScore +
    0.22 * rec +
    0.12 * budgetBlend +
    0.11 * compEase +
    0.18 * fitBlend +
    0.09 * src;

  if (lead.interest_status === "interested") {
    p += 10;
  } else if (lead.interest_status === "not_interested") {
    p -= 52;
  }

  if (opts.feedbackSummary) {
    p += feedbackPriorityDelta(lead, opts.feedbackSummary);
  }

  const fu = opts.openFollowUpCount ?? 0;
  if (fu > 0) {
    p += Math.min(6, 2 + fu);
  }

  if (opts.hasProposal) {
    p += 3;
  }

  p += weakFitPenalty(lead, opts);

  return clamp(Math.round(p), 0, 100);
}
