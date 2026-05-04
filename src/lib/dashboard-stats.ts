import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

import type { DashboardAnalyticsSnapshot } from "@/components/dashboard/analytics-cards";
import type { PipelineStage } from "@/types/database";

export type DashboardRecentLead = {
  id: string;
  client_name: string;
  company: string | null;
  budget: number | null;
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
};

export type DashboardStageRow = {
  stage: PipelineStage;
  label: string;
  count: number;
  pipelineValue: number;
};

export type DashboardPageData = {
  displayName: string | null;
  snapshot: DashboardAnalyticsSnapshot;
  recentLeads: DashboardRecentLead[];
  recentProposals: DashboardRecentProposal[];
  stages: DashboardStageRow[];
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
  leads: { score: number | null; budget: number | null; stage: string; repeat_hire: boolean | null }[],
  proposalCount: number,
  projects: { earnings: number | null; status: string | null }[],
): DashboardAnalyticsSnapshot {
  const list = leads ?? [];
  const activeLeads = list.length;
  const highConversionLeads = list.filter((l) => (l.score ?? 0) >= 80).length;
  const pipelineValue = list.reduce((sum, l) => sum + (Number(l.budget) || 0), 0);

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
    proposalsSent,
    winRatePct,
  };
}

function buildStages(
  leads: { stage: string; budget: number | null }[],
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
    cur.pipelineValue += Number(l.budget) || 0;
  }
  return STAGE_ORDER.map(({ stage, label }) => {
    const c = counts.get(stage)!;
    return { stage, label, count: c.count, pipelineValue: c.pipelineValue };
  });
}

export async function getDashboardPageData(): Promise<DashboardPageData | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return null;
  }

  const [
    { data: profile },
    { data: leadsAgg },
    { data: recentLeadRows },
    { count: proposalCount },
    { data: recentProposalRows },
    { data: projects },
  ] = await Promise.all([
    supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle(),
    supabase.from("leads").select("score, budget, stage, repeat_hire"),
    supabase
      .from("leads")
      .select("id, client_name, company, budget, score, stage, repeat_hire, metadata, updated_at")
      .order("updated_at", { ascending: false })
      .limit(12),
    supabase.from("proposals").select("id", { count: "exact", head: true }),
    supabase.from("proposals").select("id, title, created_at, lead_id").order("created_at", { ascending: false }).limit(6),
    supabase.from("projects").select("earnings, status"),
  ]);

  const agg = leadsAgg ?? [];
  const recentLeads = (recentLeadRows ?? []) as DashboardRecentLead[];
  const pc = proposalCount ?? 0;
  const snapshot = buildSnapshot(agg, pc, projects ?? []);

  const proposalsBase = recentProposalRows ?? [];
  const leadIds = [...new Set(proposalsBase.map((p) => p.lead_id).filter(Boolean))] as string[];
  let leadNameById = new Map<string, string>();
  if (leadIds.length > 0) {
    const { data: nameRows } = await supabase.from("leads").select("id, client_name").in("id", leadIds);
    leadNameById = new Map((nameRows ?? []).map((r) => [r.id, r.client_name]));
  }

  const recentProposals: DashboardRecentProposal[] = proposalsBase.map((p) => ({
    id: p.id,
    title: p.title,
    created_at: p.created_at,
    lead_id: p.lead_id,
    lead_client_name: p.lead_id ? leadNameById.get(p.lead_id) ?? null : null,
  }));

  return {
    displayName: profile?.display_name?.trim() || null,
    snapshot,
    recentLeads,
    recentProposals,
    stages: buildStages(agg),
  };
}
