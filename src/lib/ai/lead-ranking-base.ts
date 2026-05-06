import { parseStoredLeadIntelligence } from "@/lib/ai/parse-stored-lead-intelligence";
import type { LeadRow } from "@/types/database";

export function clamp(n: number, lo = 0, hi = 100): number {
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
export function hoursSinceLeadActivity(row: LeadRow): number {
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
