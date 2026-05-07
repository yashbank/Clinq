import type { ProposalEvaluationRecord } from "@/lib/ai/evaluators/proposal-quality";

function clampScore(n: unknown): number {
  const v = typeof n === "number" ? n : typeof n === "string" ? Number(n) : NaN;
  if (!Number.isFinite(v)) return 50;
  return Math.max(0, Math.min(100, Math.round(v)));
}

function strArr(v: unknown, max = 8): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string" && x.trim().length > 0).map((s) => s.trim()).slice(0, max);
}

function optStr(v: unknown, maxLen: number): string | undefined {
  if (typeof v !== "string") return undefined;
  const t = v.trim();
  if (!t) return undefined;
  return t.length > maxLen ? `${t.slice(0, maxLen)}…` : t;
}

/**
 * Best-effort parse for UI — tolerates older stored shapes and partially missing score fields.
 */
export function parseProposalEvaluation(raw: unknown): ProposalEvaluationRecord | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;

  const personalization = clampScore(o.personalization);
  const clarity = clampScore(o.clarity);
  const trust = clampScore(o.trust);
  const ctaStrength = clampScore(o.ctaStrength);
  const relevance = clampScore(o.relevance);
  const overall = clampScore(o.overall);

  const notes = strArr(o.notes, 6);
  if (notes.length === 0) {
    const fallback = optStr(o.qualitySummary, 400) ?? optStr(o.strengthSummary, 400);
    if (fallback) {
      notes.push(fallback.slice(0, 280));
    } else {
      notes.push("Evaluation returned without detailed notes — scores are approximate.");
    }
  }

  const model = typeof o.model === "string" && o.model.trim() ? o.model.trim() : "unknown";
  const evaluatedAt =
    typeof o.evaluatedAt === "string" && o.evaluatedAt.trim() ? o.evaluatedAt.trim() : new Date().toISOString();
  const tone = (typeof o.tone === "string" && o.tone.trim() ? o.tone.trim() : "professional") as ProposalEvaluationRecord["tone"];
  const mode = o.mode === "long" ? "long" : "short";

  return {
    personalization,
    clarity,
    trust,
    ctaStrength,
    relevance,
    overall,
    notes,
    improvements: strArr(o.improvements, 6),
    whyItWorks: strArr(o.whyItWorks, 5),
    weakPoints: strArr(o.weakPoints, 5),
    trustSignalsIncluded: strArr(o.trustSignalsIncluded, 6),
    strengthSummary: optStr(o.strengthSummary, 700),
    scoringConfidenceNote: optStr(o.scoringConfidenceNote, 400),
    qualitySummary: optStr(o.qualitySummary, 260),
    actionableGaps: strArr(o.actionableGaps, 3).map((s) => s.slice(0, 140)),
    trustFitNote: optStr(o.trustFitNote, 240),
    model,
    evaluatedAt,
    tone,
    mode,
  };
}
