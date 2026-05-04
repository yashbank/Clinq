import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

import type { DashboardAnalyticsSnapshot } from "@/components/dashboard/analytics-cards";

export async function getDashboardAnalyticsSnapshot(): Promise<DashboardAnalyticsSnapshot | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return null;
  }

  const [{ data: leads }, { data: proposals }, { data: projects }] = await Promise.all([
    supabase.from("leads").select("score, budget, stage, repeat_hire"),
    supabase.from("proposals").select("id"),
    supabase.from("projects").select("earnings, status"),
  ]);

  const list = leads ?? [];
  const activeLeads = list.length;
  const highConversionLeads = list.filter((l) => (l.score ?? 0) >= 80).length;
  const pipelineValue = list.reduce((sum, l) => sum + (Number(l.budget) || 0), 0);

  const proj = projects ?? [];
  const revenueMtd = proj
    .filter((p) => p.status === "completed")
    .reduce((sum, p) => sum + (Number(p.earnings) || 0), 0);

  const proposalsSent = proposals?.length ?? 0;
  const completedStages = list.filter((l) => l.stage === "completed").length;
  const winRatePct =
    proposalsSent > 0 ? Math.min(100, Math.round((completedStages / Math.max(1, activeLeads)) * 100)) : 0;

  return {
    activeLeads,
    highConversionLeads,
    revenueMtd,
    pipelineValue,
    proposalsSent,
    winRatePct,
  };
}
