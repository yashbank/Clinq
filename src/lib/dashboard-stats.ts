import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

import type { DashboardAnalyticsSnapshot } from "@/components/dashboard/analytics-cards";
import { getUsdToForeignRates } from "@/lib/currency/exchange-rates";
import { formatUsdTotalForDisplay, leadBudgetAsUsd } from "@/lib/currency/format-pipeline-budget";
import {
  canonicalLeadProjectTitle,
  canonicalLeadSummaryLine,
  canonicalPlatformBadge,
  canonicalProposalHref,
} from "@/lib/leads/canonical-lead-display";
import { computeLeadBudgetUiLine } from "@/lib/leads/lead-budget-ui";
import { buildDailyActions, type DailyAction } from "@/lib/ai/daily-actions";
import { computeLeadPriorityScore, generatePriorityReason } from "@/lib/ai/lead-priority";
import { buildDashboardRecommendations, type DashboardRecommendation } from "@/lib/dashboard-recommendations";
import { computeLeadFreelancerMatch } from "@/lib/leads/lead-freelancer-match";
import { parseStoredProfileIntelligence } from "@/lib/profile/intelligence/parse";
import { parseProposalEvaluation } from "@/lib/proposal/parse-evaluation";
import type { LeadRow, PipelineStage } from "@/types/database";

export type DashboardRecentLead = {
  id: string;
  /** Kept for filters / legacy; matches canonical project title. */
  client_name: string;
  projectTitle: string;
  platformLabel: string;
  summaryLine: string;
  proposalHref: string;
  company: string | null;
  budget: number | null;
  budgetLabel: string;
  score: number;
  stage: PipelineStage;
  repeat_hire: boolean;
  updated_at: string;
  metadata: Record<string, unknown>;
};

export type DashboardRecentProposal = {
  id: string;
  title: string | null;
  created_at: string;
  lead_id: string | null;
  lead_client_name: string | null;
  evaluation?: unknown;
};

export type DashboardStageRow = {
  stage: PipelineStage;
  label: string;
  count: number;
  /** Sum of lead budgets in USD (for optional client-side formatting). */
  pipelineValue: number;
};

export type DashboardInsightLine = {
  title: string;
  subtitle: string;
  href: string;
};

export type DashboardInsights = {
  topApply: DashboardInsightLine[];
  highScore: DashboardInsightLine[];
  weakProposals: DashboardInsightLine[];
  suggestions: DashboardInsightLine[];
};

export type DashboardPriorityLead = {
  id: string;
  title: string;
  budget: number | null;
  /** Same display rules as Leads table / pipeline. */
  budgetLabel: string;
  score: number;
  priorityScore: number;
  reason: string;
  href: string;
};

export type DashboardPageData = {
  displayName: string | null;
  /** True when profile wizard has not been completed or skipped. */
  needsProfileOnboarding: boolean;
  snapshot: DashboardAnalyticsSnapshot;
  recentLeads: DashboardRecentLead[];
  recentProposals: DashboardRecentProposal[];
  stages: DashboardStageRow[];
  recommendations: DashboardRecommendation[];
  insights: DashboardInsights;
  topPriorityLeads: DashboardPriorityLead[];
  dailyActions: DailyAction[];
  preferredCurrency: string;
  usdToForeignRates: Record<string, number> | null;
};

const STAGE_ORDER: { stage: PipelineStage; label: string }[] = [
  { stage: "saved", label: "Saved" },
  { stage: "applied", label: "Applied" },
  { stage: "replied", label: "Replied" },
  { stage: "interview", label: "Interview" },
  { stage: "active", label: "Active" },
  { stage: "completed", label: "Completed" },
];

function buildSnapshot(
  leads: Pick<
    LeadRow,
    "score" | "budget" | "budget_usd" | "budget_avg" | "budget_min" | "budget_max" | "currency_original" | "metadata" | "stage" | "repeat_hire"
  >[],
  proposalCount: number,
  projects: { earnings: number | null; status: string | null }[],
  display: { preferredCurrency: string; usdToForeignRates: Record<string, number> | null },
): DashboardAnalyticsSnapshot {
  const list = leads ?? [];
  const activeLeads = list.length;
  const highConversionLeads = list.filter((l) => (l.score ?? 0) >= 80).length;
  const pipelineValue = list.reduce((sum, l) => sum + leadBudgetAsUsd(l, display.usdToForeignRates), 0);

  const proj = projects ?? [];
  const revenueMtd = proj
    .filter((p) => p.status === "completed")
    .reduce((sum, p) => sum + (Number(p.earnings) || 0), 0);

  const proposalsSent = proposalCount;
  const completedStages = list.filter((l) => l.stage === "completed").length;
  const winRatePct =
    proposalsSent > 0 && activeLeads > 0
      ? Math.min(100, Math.round((completedStages / activeLeads) * 100))
      : 0;

  return {
    activeLeads,
    highConversionLeads,
    revenueMtd,
    pipelineValue,
    pipelineValueDisplay: formatUsdTotalForDisplay(pipelineValue, display.preferredCurrency, display.usdToForeignRates),
    proposalsSent,
    winRatePct,
  };
}

function buildStages(
  leads: Pick<
    LeadRow,
    "stage" | "budget" | "budget_usd" | "budget_avg" | "budget_min" | "budget_max" | "currency_original" | "metadata"
  >[],
  usdToForeignRates: Record<string, number> | null,
): DashboardStageRow[] {
  const counts = new Map<PipelineStage, { count: number; pipelineValue: number }>();
  for (const { stage } of STAGE_ORDER) {
    counts.set(stage, { count: 0, pipelineValue: 0 });
  }
  for (const l of leads) {
    const key = l.stage as PipelineStage;
    if (!counts.has(key)) continue;
    const cur = counts.get(key)!;
    cur.count += 1;
    cur.pipelineValue += leadBudgetAsUsd(l, usdToForeignRates);
  }
  return STAGE_ORDER.map(({ stage, label }) => {
    const c = counts.get(stage)!;
    return { stage, label, count: c.count, pipelineValue: c.pipelineValue };
  });
}

function buildTopPriorityLeads(
  rows: LeadRow[],
  freelancer: { skills: string[]; techStack: string[]; niches: string[] },
  currency: { preferredCurrency: string; usdToForeignRates: Record<string, number> | null },
): DashboardPriorityLead[] {
  const ranked = rows.map((row) => {
    const match = computeLeadFreelancerMatch(row, freelancer);
    const priorityScore = computeLeadPriorityScore(row);
    const reason = generatePriorityReason(row, { skillMatchPct: match.skillMatchPct });
    const title = canonicalLeadProjectTitle(row);
    const href = `/leads?sort=recommended&q=${encodeURIComponent(title)}`;
    const budgetUi = computeLeadBudgetUiLine(row, currency.preferredCurrency, currency.usdToForeignRates);
    return {
      id: row.id,
      title,
      budget: row.budget,
      budgetLabel: budgetUi.show ? budgetUi.label : "—",
      score: row.score,
      priorityScore,
      reason,
      href,
    };
  });
  return ranked.sort((a, b) => b.priorityScore - a.priorityScore).slice(0, 5);
}

export async function getDashboardPageData(): Promise<DashboardPageData | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return null;
  }

  const MS_DAY = 86_400_000;

  const [
    { data: profile },
    { data: leadsAgg },
    { data: recentLeadRows },
    { count: proposalCount },
    { data: recentProposalRows },
    { data: projects },
    { data: proposalLeadRows },
    { data: activityRows },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, profile_onboarding_completed_at, profile_intelligence, skills, tech_stack, niches, preferred_currency")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("leads")
      .select("score, budget, budget_usd, budget_avg, budget_min, budget_max, currency_original, metadata, stage, repeat_hire")
      .is("deleted_at", null)
      .is("archived_at", null),
    supabase
      .from("leads")
      .select("*")
      .is("deleted_at", null)
      .is("archived_at", null)
      .order("updated_at", { ascending: false })
      .limit(70),
    supabase.from("proposals").select("id", { count: "exact", head: true }),
    supabase
      .from("proposals")
      .select("id, title, created_at, lead_id, evaluation")
      .order("created_at", { ascending: false })
      .limit(6),
    supabase.from("projects").select("earnings, status"),
    supabase.from("proposals").select("lead_id").not("lead_id", "is", null),
    supabase
      .from("activities")
      .select("lead_id, created_at")
      .eq("user_id", user.id)
      .gte("created_at", new Date(Date.now() - 10 * MS_DAY).toISOString())
      .order("created_at", { ascending: false })
      .limit(500),
  ]);

  const agg = leadsAgg ?? [];
  const fullLeadRows = (recentLeadRows ?? []) as LeadRow[];
  const freelancerForPriority = {
    skills: Array.isArray(profile?.skills) ? (profile?.skills as string[]) : [],
    techStack: Array.isArray(profile?.tech_stack) ? (profile?.tech_stack as string[]) : [],
    niches: Array.isArray(profile?.niches) ? (profile?.niches as string[]) : [],
  };
  let usdToForeignRates: Record<string, number> | null = null;
  try {
    usdToForeignRates = await getUsdToForeignRates();
  } catch {
    usdToForeignRates = null;
  }
  const preferredCurrency = typeof profile?.preferred_currency === "string" && profile.preferred_currency.trim()
    ? profile.preferred_currency.trim()
    : "USD";

  const recentLeads: DashboardRecentLead[] = fullLeadRows.map((r) => {
    const bl = computeLeadBudgetUiLine(r, preferredCurrency, usdToForeignRates);
    const projectTitle = canonicalLeadProjectTitle(r);
    return {
      id: r.id,
      client_name: projectTitle,
      projectTitle,
      platformLabel: canonicalPlatformBadge(r),
      summaryLine: canonicalLeadSummaryLine(r).slice(0, 220),
      proposalHref: canonicalProposalHref(r.id),
      company: r.company,
      budget: r.budget,
      budgetLabel: bl.show ? bl.label : "—",
      score: r.score,
      stage: r.stage,
      repeat_hire: r.repeat_hire,
      updated_at: r.updated_at,
      metadata: (r.metadata && typeof r.metadata === "object" ? r.metadata : {}) as Record<string, unknown>,
    };
  });

  const topPriorityLeads = buildTopPriorityLeads(fullLeadRows, freelancerForPriority, {
    preferredCurrency,
    usdToForeignRates,
  });
  const pc = proposalCount ?? 0;
  const snapshot = buildSnapshot(agg, pc, projects ?? [], { preferredCurrency, usdToForeignRates });

  const proposalsBase = recentProposalRows ?? [];
  const leadIds = [...new Set(proposalsBase.map((p) => p.lead_id).filter(Boolean))] as string[];
  let leadNameById = new Map<string, string>();
  if (leadIds.length > 0) {
    const { data: nameRows } = await supabase
      .from("leads")
      .select("id, client_name")
      .in("id", leadIds)
      .is("deleted_at", null)
      .is("archived_at", null);
    leadNameById = new Map((nameRows ?? []).map((r) => [r.id, r.client_name]));
  }

  const recentProposals: DashboardRecentProposal[] = proposalsBase.map((p) => ({
    id: p.id,
    title: p.title,
    created_at: p.created_at,
    lead_id: p.lead_id,
    lead_client_name: p.lead_id ? leadNameById.get(p.lead_id) ?? null : null,
    evaluation: p.evaluation ?? undefined,
  }));

  const intel = parseStoredProfileIntelligence(profile?.profile_intelligence);
  const proposalLeadIds = new Set(
    (proposalLeadRows ?? []).map((r) => r.lead_id).filter((id): id is string => typeof id === "string" && id.length > 0),
  );
  const dailyActions = buildDailyActions({
    leads: fullLeadRows,
    proposals: (recentProposalRows ?? []) as Array<{
      id: string;
      lead_id: string | null;
      title: string | null;
      created_at: string;
      evaluation?: unknown;
    }>,
    activities: (activityRows ?? []) as Array<{ lead_id: string | null; created_at: string }>,
    leadIdsWithProposal: proposalLeadIds,
  });
  const recommendations = buildDashboardRecommendations({
    recentLeads,
    recentProposals,
    profileQualityScore: intel?.profileQualityScore ?? null,
    proposalLeadIds,
  });

  const topApply = recentLeads
    .filter((l) => l.stage === "saved" && l.score >= 70)
    .slice(0, 5)
    .map((l) => ({
      title: l.client_name,
      subtitle: `Score ${l.score} · ${l.company?.trim() || "No company"}`,
      href: `/leads?q=${encodeURIComponent(l.client_name)}`,
    }));

  const highScore = recentLeads
    .filter((l) => l.score >= 80)
    .slice(0, 5)
    .map((l) => ({
      title: l.client_name,
      subtitle: `Score ${l.score} · stage ${l.stage}`,
      href: "/leads?view=high_potential",
    }));

  const weakProposals: DashboardInsightLine[] = [];
  for (const p of recentProposals) {
    const ev = parseProposalEvaluation(p.evaluation);
    if (ev && ev.overall < 58) {
      weakProposals.push({
        title: (p.title ?? "Proposal").slice(0, 72),
        subtitle: `Overall ${ev.overall} — last evaluation`,
        href: "/proposals",
      });
    }
    if (weakProposals.length >= 5) break;
  }

  const suggestions: DashboardInsightLine[] = recommendations.slice(0, 6).map((r) => ({
    title: r.title,
    subtitle: r.detail,
    href: r.href,
  }));

  const insights: DashboardInsights = {
    topApply,
    highScore,
    weakProposals,
    suggestions,
  };

  return {
    displayName: profile?.display_name?.trim() || null,
    needsProfileOnboarding: !profile?.profile_onboarding_completed_at,
    snapshot,
    recentLeads,
    recentProposals,
    stages: buildStages(agg, usdToForeignRates),
    recommendations,
    insights,
    topPriorityLeads,
    dailyActions,
    preferredCurrency,
    usdToForeignRates,
  };
}
