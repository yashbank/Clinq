import { formatDistanceToNow } from "date-fns";

import { intelligenceFromMetadata, type LeadTier } from "@/lib/ai/lead-intelligence";
import { isHighConversionScore } from "@/lib/ai/lead-score";
import {
  canonicalLeadProjectTitle,
  canonicalLeadSummaryLine,
  canonicalPlatformBadge,
} from "@/lib/leads/canonical-lead-display";
import { computeLeadBudgetUiLine } from "@/lib/leads/lead-budget-ui";
import { getLeadImportedAtIso, isFreelancerLeadRow, isImportedLeadRow } from "@/lib/leads/source-filters";
import type { LeadRow } from "@/types/database";
import type { Lead } from "@/types/leads-ui";

function initials(label: string): string {
  const words = label.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return `${words[0]![0] ?? ""}${words[1]![0] ?? ""}`.toUpperCase() || "?";
  }
  return (label[0] ?? "?").toUpperCase();
}

function scoreToStatus(score: number): Lead["status"] {
  if (score >= 80) return "hot";
  if (score >= 65) return "warm";
  if (score >= 45) return "new";
  return "cold";
}

function competitionToScam(competition: number): Lead["scamRisk"] {
  if (competition >= 5) return "high";
  if (competition >= 3) return "medium";
  return "low";
}

function scoreToUrgency(score: number, competition: number): { bidUrgency: Lead["bidUrgency"]; bestTimeToBid: string } {
  if (score >= 85 && competition <= 2) return { bidUrgency: "now", bestTimeToBid: "Now" };
  if (score >= 75) return { bidUrgency: "today", bestTimeToBid: "Today" };
  if (score >= 60) return { bidUrgency: "tomorrow", bestTimeToBid: "Tomorrow" };
  if (score >= 45) return { bidUrgency: "this-week", bestTimeToBid: "This week" };
  return { bidUrgency: "later", bestTimeToBid: "Plan outreach" };
}

function defaultTier(score: number): LeadTier {
  if (score >= 78) return "high-value";
  if (score <= 30) return "time-waster";
  if (score < 48) return "low-signal";
  return "standard";
}

export function mapLeadRowToUiLead(
  row: LeadRow,
  extras?: {
    proposalStatus?: Lead["proposalStatus"];
    preferredCurrency?: string | null;
    usdToForeignRates?: Record<string, number> | null;
  },
): Lead {
  const budget = Number(row.budget) || 0;
  const score = row.score;
  const { bidUrgency, bestTimeToBid } = scoreToUrgency(score, row.competition_level);
  const high = isHighConversionScore(score);

  const meta = (row.metadata && typeof row.metadata === "object" ? row.metadata : {}) as Record<string, unknown>;
  const sourceRaw = meta.source;
  const sourceChannel =
    typeof sourceRaw === "string" && sourceRaw.length > 0 && sourceRaw !== "manual" ? sourceRaw : null;
  const importedAt = getLeadImportedAtIso(row);
  const isImported = isImportedLeadRow(row);
  const isFreelancer = isFreelancerLeadRow(row);
  const int = intelligenceFromMetadata(meta);
  const projectTitle = canonicalLeadProjectTitle(row);
  const projectUrl = typeof meta.project_url === "string" ? meta.project_url : "";
  const leadTier = (int.tier as LeadTier | undefined) ?? defaultTier(score);
  const confidenceScore = typeof int.confidence === "number" ? int.confidence : 50;
  const intelligenceFlags = Array.isArray(int.flags) ? (int.flags as string[]) : [];

  const strategy =
    typeof int.proposalStrategyHint === "string" && int.proposalStrategyHint.length > 0
      ? int.proposalStrategyHint
      : null;

  const portfolioAngle =
    typeof meta.portfolio_angle_suggestion === "string" && meta.portfolio_angle_suggestion.trim().length > 0
      ? meta.portfolio_angle_suggestion.trim()
      : null;

  const scamFromMeta =
    meta.scam_risk_label === "low" || meta.scam_risk_label === "medium" || meta.scam_risk_label === "high"
      ? (meta.scam_risk_label as Lead["scamRisk"])
      : null;

  const seriousnessScore =
    typeof meta.seriousness_score === "number" && Number.isFinite(meta.seriousness_score)
      ? Math.min(100, Math.max(0, Math.round(meta.seriousness_score)))
      : Math.min(100, Math.max(0, Math.round(score * 0.72 + (row.repeat_hire ? 8 : 0))));

  const aiInsight =
    [strategy, portfolioAngle].filter(Boolean).join(" ") ||
    row.proposal_match_notes?.trim() ||
    (high
      ? "Strong fit on score—tailor proof points to the brief and your saved profile."
      : "Review brief and competition. Add strategy notes when you research the buyer.");

  const shortSummary = canonicalLeadSummaryLine(row);

  const { label: budgetLine, kind: budgetKind } = computeLeadBudgetUiLine(
    row,
    extras?.preferredCurrency ?? null,
    extras?.usdToForeignRates ?? null,
  );

  return {
    id: row.id,
    interest_status: row.interest_status ?? null,
    name: projectTitle,
    projectTitle,
    projectUrl,
    shortSummary,
    budgetLine,
    budgetKind,
    leadTier,
    confidenceScore,
    intelligenceFlags,
    company: row.company || canonicalPlatformBadge(row),
    email: row.email || "—",
    phone: row.phone || "—",
    avatar: initials(projectTitle),
    value: budget,
    aiScore: score,
    conversionScore: score,
    status: scoreToStatus(score),
    scamRisk: scamFromMeta ?? competitionToScam(row.competition_level),
    seriousnessScore,
    lastContact: formatDistanceToNow(new Date(row.updated_at), { addSuffix: true }),
    aiInsight,
    bestTimeToBid,
    bidUrgency,
    isRepeatClient: row.repeat_hire,
    projectsCompleted: row.repeat_hire ? 2 : 0,
    totalRevenue: row.repeat_hire ? budget * 2 : 0,
    responseRate: Math.min(99, 55 + Math.round(score / 3)),
    avgResponseTime: score >= 75 ? "2h" : score >= 55 ? "6h" : "24h",
    industry: row.platform || "General",
    proposalStatus: extras?.proposalStatus ?? "none",
    competitorCount: Math.max(0, row.competition_level * 2 - 1),
    winProbability: Math.min(98, Math.round(score * 0.85 + (row.repeat_hire ? 8 : 0))),
    sourceChannel: isFreelancer ? "freelancer" : sourceChannel,
    importedAt,
    isImported,
  };
}
