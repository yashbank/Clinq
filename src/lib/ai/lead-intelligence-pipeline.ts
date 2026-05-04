import type { LeadIntelligence } from "@/lib/ai/lead-intelligence";
import type { LeadScoreInput } from "@/lib/ai/lead-score";

export type LeadIntelligenceV1 = {
  version: 1;
  generatedAt: string;
  base: Pick<LeadIntelligence, "score" | "confidence" | "tier" | "flags" | "proposalStrategyHint">;
  workflow: {
    scam_risk_score: number;
    scam_risk_label: string;
    seriousness_score: number;
    portfolio_angle_suggestion: string;
  };
  signals: {
    vagueClientScore: number;
    unrealisticBudgetScore: number;
    urgencyScore: number;
    repeatClientProbability: number;
    portfolioMatchScore: number;
    proposalSuccessProbability: number;
  };
  explanations: string[];
};

type WorkflowSnap = {
  scam_risk_score: number;
  scam_risk_label: string;
  seriousness_score: number;
  portfolio_angle_suggestion: string;
};

function clamp(n: number, lo = 0, hi = 100) {
  return Math.max(lo, Math.min(hi, n));
}

function tokenOverlap(a: string, tokens: string[]): number {
  const hay = a.toLowerCase();
  if (!hay.trim()) return 0;
  let hits = 0;
  for (const t of tokens) {
    const k = t.toLowerCase().trim();
    if (k.length < 2) continue;
    if (hay.includes(k)) hits += 1;
  }
  return tokens.length ? hits / Math.min(tokens.length, 24) : 0;
}

function vagueClientScore(projectQuality: number, descLen: number): number {
  const lenPart = descLen < 40 ? 55 : descLen < 120 ? 30 : 10;
  const pqPart = (6 - Math.min(5, Math.max(1, projectQuality))) * 12;
  return clamp(Math.round(lenPart + pqPart));
}

function unrealisticBudgetScore(budget: number | null, combinedText: string): number {
  const b = Math.max(0, Number(budget) || 0);
  let s = 5;
  if (b > 0 && b < 250 && /(full|complete)\s*(app|website|platform|saas)/i.test(combinedText)) {
    s += 70;
  }
  if (b > 0 && b < 500 && /(enterprise|multi-tenant|kubernetes)/i.test(combinedText)) {
    s += 25;
  }
  if (b === 0 && /(\$\s*\d|\d+\s*usd|budget)/i.test(combinedText)) {
    s += 15;
  }
  return clamp(s);
}

function urgencyScore(combined: string): number {
  if (/\b(asap|urgent|needed\s*today|eod|within\s*24\s*h)\b/i.test(combined)) return 78;
  if (/\b(this week|by friday|deadline)\b/i.test(combined)) return 52;
  return 22;
}

function repeatClientProbability(repeatHire: boolean, company: string | null): number {
  let p = repeatHire ? 0.72 : 0.18;
  if ((company ?? "").trim().length > 2) p += 0.08;
  return clamp(Math.round(p * 100));
}

function portfolioMatchScore(description: string, profileTokens: string[]): number {
  const ratio = tokenOverlap(description, profileTokens);
  return clamp(Math.round(ratio * 100));
}

function proposalSuccessProbability(args: {
  leadScore: number;
  scamRisk: number;
  portfolioMatch: number;
  vague: number;
  unrealisticBudget: number;
}): number {
  const scamPenalty = args.scamRisk / 100;
  const vaguePenalty = args.vague / 100;
  const budgetPenalty = args.unrealisticBudget / 100;
  const raw =
    args.leadScore * 0.38 +
    args.portfolioMatch * 0.22 +
    (1 - scamPenalty) * 22 +
    (1 - vaguePenalty) * 10 +
    (1 - budgetPenalty) * 8;
  return clamp(Math.round(raw));
}

export function buildLeadIntelligenceRecord(args: {
  intel: LeadIntelligence;
  workflow: WorkflowSnap;
  scoreInput: LeadScoreInput;
  projectTitle: string | null;
  projectDescription: string | null;
  projectUrl: string | null;
  company: string | null;
  profileTokens: string[];
}): LeadIntelligenceV1 {
  const desc = `${args.projectTitle ?? ""} ${args.projectDescription ?? ""}`.trim();
  const combined = `${desc} ${args.projectUrl ?? ""}`.toLowerCase();
  const descLen = (args.projectDescription ?? "").trim().length;

  const vague = vagueClientScore(args.scoreInput.projectQuality, descLen);
  const unrealistic = unrealisticBudgetScore(args.scoreInput.budget, `${combined} ${desc}`);
  const urgency = urgencyScore(combined);
  const repeatP = repeatClientProbability(args.scoreInput.repeatHire, args.company);
  const portfolioMatch = portfolioMatchScore(desc, args.profileTokens);
  const proposalSuccess = proposalSuccessProbability({
    leadScore: args.intel.score,
    scamRisk: args.workflow.scam_risk_score,
    portfolioMatch,
    vague,
    unrealisticBudget: unrealistic,
  });

  const explanations: string[] = [];
  explanations.push(`Lead score ${args.intel.score} with tier ${args.intel.tier}.`);
  explanations.push(`Scam heuristics: ${args.workflow.scam_risk_label} (${args.workflow.scam_risk_score}/100).`);
  if (vague >= 55) explanations.push("Brief looks thin or underspecified—ask clarifying questions before heavy work.");
  if (unrealistic >= 60) explanations.push("Budget may be misaligned with described scope.");
  if (portfolioMatch >= 45) explanations.push("Solid overlap between job language and your profile skills/niches.");
  if (urgency >= 60) explanations.push("Timeline language suggests elevated urgency.");

  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    base: {
      score: args.intel.score,
      confidence: args.intel.confidence,
      tier: args.intel.tier,
      flags: args.intel.flags,
      proposalStrategyHint: args.intel.proposalStrategyHint,
    },
    workflow: { ...args.workflow },
    signals: {
      vagueClientScore: vague,
      unrealisticBudgetScore: unrealistic,
      urgencyScore: urgency,
      repeatClientProbability: repeatP,
      portfolioMatchScore: portfolioMatch,
      proposalSuccessProbability: proposalSuccess,
    },
    explanations,
  };
}
