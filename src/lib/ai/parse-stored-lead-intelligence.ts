import type { LeadIntelligenceV1 } from "@/lib/ai/lead-intelligence-pipeline";

export function parseStoredLeadIntelligence(raw: unknown): LeadIntelligenceV1 | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Partial<LeadIntelligenceV1> & Record<string, unknown>;
  if (o.version !== 1 || typeof o.generatedAt !== "string") return null;
  if (!o.base || !o.workflow || !o.signals || !Array.isArray(o.explanations)) return null;
  const s = o.signals as Partial<LeadIntelligenceV1["signals"]> & Record<string, unknown>;
  const signals: LeadIntelligenceV1["signals"] = {
    vagueClientScore: Number(s.vagueClientScore) || 0,
    unrealisticBudgetScore: Number(s.unrealisticBudgetScore) || 0,
    urgencyScore: Number(s.urgencyScore) || 0,
    repeatClientProbability: Number(s.repeatClientProbability) || 0,
    portfolioMatchScore: Number(s.portfolioMatchScore) || 0,
    proposalSuccessProbability: Number(s.proposalSuccessProbability) || 0,
    ...(typeof s.competitionDifficultyScore === "number" ? { competitionDifficultyScore: s.competitionDifficultyScore } : {}),
    ...(typeof s.proposalEffortScore === "number" ? { proposalEffortScore: s.proposalEffortScore } : {}),
  };
  return { ...(o as LeadIntelligenceV1), signals };
}
