export type LeadScoreInput = {
  budget: number | null;
  repeatHire: boolean;
  /** 1 = low competition, 5 = very crowded */
  competitionLevel: number;
  /** 1 = vague, 5 = very clear brief */
  projectQuality: number;
  clientHistory?: string | null;
  proposalMatchNotes?: string | null;
};

/**
 * Deterministic 0–100 score. Tune weights as you gather real conversion data.
 * High-conversion highlight threshold in UI: 80+.
 */
export function computeLeadScore(input: LeadScoreInput): number {
  const budget = Math.max(0, Number(input.budget) || 0);
  const budgetPart = Math.min(30, Math.log10(budget + 10) * 9);

  const repeatPart = input.repeatHire ? 16 : 0;

  const comp = Math.min(5, Math.max(1, input.competitionLevel));
  const competitionPart = (6 - comp) * 4.5;

  const pq = Math.min(5, Math.max(1, input.projectQuality));
  const qualityPart = pq * 4;

  const histLen = (input.clientHistory ?? "").trim().length;
  const historyPart = Math.min(10, histLen / 25);

  const matchLen = (input.proposalMatchNotes ?? "").trim().length;
  const matchPart = Math.min(10, matchLen / 30);

  const raw = budgetPart + repeatPart + competitionPart + qualityPart + historyPart + matchPart;
  return Math.round(Math.min(100, Math.max(0, raw)));
}

export function isHighConversionScore(score: number): boolean {
  return score >= 80;
}
