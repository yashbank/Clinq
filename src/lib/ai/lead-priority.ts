import { parseStoredLeadIntelligence } from "@/lib/ai/parse-stored-lead-intelligence";
import type { LeadRow } from "@/types/database";

function clamp(n: number, lo = 0, hi = 100): number {
  return Math.max(lo, Math.min(hi, n));
}

/** 0–100: higher = healthier budget signal for prioritization. */
export function budgetQualityScore(budget: number | null): number {
  const b = Math.max(0, Number(budget) || 0);
  if (b <= 0) return 36;
  if (b < 150) return clamp(40 + b / 6, 0, 100);
  if (b < 800) return clamp(52 + (b - 150) / 35, 0, 100);
  if (b < 4000) return clamp(68 + (b - 800) / 200, 0, 100);
  return clamp(78 + Math.log10(b / 4000 + 1) * 14, 0, 100);
}

/** Hours since the more recent of created_at / updated_at. */
function hoursSinceLeadActivity(row: LeadRow): number {
  const tUp = new Date(row.updated_at).getTime();
  const tCr = new Date(row.created_at).getTime();
  const t = Math.max(Number.isFinite(tUp) ? tUp : 0, Number.isFinite(tCr) ? tCr : 0);
  if (!t) return 24 * 365;
  return Math.max(0, (Date.now() - t) / 3_600_000);
}

/** 0–100: newer activity = higher. */
export function recencyScore(row: LeadRow): number {
  const h = hoursSinceLeadActivity(row);
  const halfLifeH = 18 * 24;
  return clamp(100 * Math.exp(-h / halfLifeH), 0, 100);
}

/**
 * Higher = harder to win (from stored intelligence when present, else derived from competition_level).
 */
export function getCompetitionDifficultyScore(lead: LeadRow): number {
  const parsed = parseStoredLeadIntelligence(lead.intelligence);
  const fromIntel = parsed?.signals?.competitionDifficultyScore;
  if (typeof fromIntel === "number" && Number.isFinite(fromIntel)) {
    return clamp(fromIntel, 0, 100);
  }
  const c = Math.min(5, Math.max(1, Number(lead.competition_level) || 2));
  return clamp(Math.round(c * 18), 0, 100);
}

export type LeadPriorityContext = {
  /** 0–100 overlap from profile vs brief (optional, from `computeLeadFreelancerMatch`). */
  skillMatchPct?: number;
};

/**
 * Weighted 0–100 priority: lead score, recency, budget quality, competition ease, interest_status.
 */
export function computeLeadPriorityScore(lead: LeadRow): number {
  const scoreW = 0.4 * clamp(Number(lead.score) || 0, 0, 100);
  const recW = 0.2 * recencyScore(lead);
  const budW = 0.18 * budgetQualityScore(lead.budget);
  const diff = getCompetitionDifficultyScore(lead);
  const compW = 0.22 * clamp(100 - diff, 0, 100);

  let p = scoreW + recW + budW + compW;

  if (lead.interest_status === "interested") {
    p += 10;
  } else if (lead.interest_status === "not_interested") {
    p -= 52;
  }

  return clamp(Math.round(p), 0, 100);
}

/**
 * Single short deterministic line for UI (no AI).
 */
export function generatePriorityReason(lead: LeadRow, context?: LeadPriorityContext): string {
  if (lead.interest_status === "not_interested") {
    return "Marked not interested — deprioritized";
  }

  const intel = parseStoredLeadIntelligence(lead.intelligence);
  const portfolioMatch = typeof intel?.signals?.portfolioMatchScore === "number" ? intel.signals.portfolioMatchScore : null;
  const skillPct = context?.skillMatchPct;

  const diff = getCompetitionDifficultyScore(lead);
  const b = Math.max(0, Number(lead.budget) || 0);
  const hours = hoursSinceLeadActivity(lead);
  const score = Number(lead.score) || 0;

  if ((skillPct != null && skillPct >= 42) || (portfolioMatch != null && portfolioMatch >= 52)) {
    return "Strong match with your skills";
  }
  if (b >= 2500 && diff <= 48) {
    return "High budget, low competition";
  }
  if (hours <= 72 && score >= 64) {
    return "Recently posted, high chance";
  }
  if (lead.interest_status === "interested") {
    return "You flagged this as interested";
  }
  if (lead.repeat_hire) {
    return "Repeat client — relationship edge";
  }
  if (score >= 82) {
    return "Top Clinq score — worth a fast review";
  }
  if (diff <= 36) {
    return "Lighter competition on this brief";
  }
  if (b >= 800 && score >= 58) {
    return "Solid budget with workable score";
  }
  return "Balanced opportunity — check fit in the brief";
}
