import type { ProposalEvaluationRecord } from "@/lib/ai/evaluators/proposal-quality";

/** Best-effort parse for UI — tolerates older stored shapes. */
export function parseProposalEvaluation(raw: unknown): ProposalEvaluationRecord | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const nums = ["personalization", "clarity", "trust", "ctaStrength", "relevance", "overall"] as const;
  for (const k of nums) {
    const v = o[k];
    if (typeof v !== "number" || Number.isNaN(v)) return null;
  }
  if (!Array.isArray(o.notes)) return null;
  return o as unknown as ProposalEvaluationRecord;
}
