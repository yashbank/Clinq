import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { PipelineStage } from "@/types/database";

const STAGE_LABELS: Record<PipelineStage, string> = {
  saved: "Saved",
  applied: "Applied",
  replied: "Replied",
  interview: "Interview",
  active: "Active",
  completed: "Completed",
};

const STAGES: PipelineStage[] = ["saved", "applied", "replied", "interview", "active", "completed"];

const REPLIED_PLUS: PipelineStage[] = ["replied", "interview", "active", "completed"];
const POST_APPLIED: PipelineStage[] = ["applied", "replied", "interview", "active", "completed"];

function platformLabel(platform: string | null, metadata: Record<string, unknown> | null): string {
  const src = typeof metadata?.source === "string" ? metadata.source.trim() : "";
  const p = platform?.trim();
  if (p) return p;
  if (src) return src;
  return "Unspecified";
}

export type AnalyticsSnapshot = {
  totals: { leads: number; proposals: number; completedLeads: number };
  avgLeadScore: number;
  pctHighQuality: number;
  /** Among leads that moved past Saved: % currently at Replied or later (pipeline proxy for “reply”). */
  replyProgressPct: number | null;
  /** % of logged proposals that reference a lead. */
  proposalLinkedPct: number | null;
  /** Completed leads ÷ all leads (0–100). */
  completionRatePct: number | null;
  pipelineByStage: { stage: PipelineStage; label: string; count: number }[];
  platformBreakdown: { label: string; count: number }[];
};

export async function getAnalyticsSnapshot(): Promise<AnalyticsSnapshot | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: leads }, { data: proposals }] = await Promise.all([
    supabase.from("leads").select("id, stage, score, platform, metadata"),
    supabase.from("proposals").select("id, lead_id"),
  ]);

  const list = leads ?? [];
  const props = proposals ?? [];

  const totals = {
    leads: list.length,
    proposals: props.length,
    completedLeads: list.filter((l) => l.stage === "completed").length,
  };

  const avgLeadScore =
    list.length > 0 ? Math.round(list.reduce((s, l) => s + (Number(l.score) || 0), 0) / list.length) : 0;
  const high = list.filter((l) => (Number(l.score) || 0) >= 75).length;
  const pctHighQuality = list.length > 0 ? Math.round((100 * high) / list.length) : 0;

  const pastSaved = list.filter((l) => l.stage !== "saved");
  const repliedPlus = list.filter((l) => REPLIED_PLUS.includes(l.stage as PipelineStage));
  const postApplied = list.filter((l) => POST_APPLIED.includes(l.stage as PipelineStage));

  let replyProgressPct: number | null = null;
  if (postApplied.length > 0) {
    replyProgressPct = Math.min(100, Math.round((100 * repliedPlus.length) / postApplied.length));
  } else if (pastSaved.length > 0) {
    replyProgressPct = Math.min(100, Math.round((100 * repliedPlus.length) / pastSaved.length));
  }

  const withLead = props.filter((p) => p.lead_id != null).length;
  const proposalLinkedPct =
    props.length > 0 ? Math.min(100, Math.round((100 * withLead) / props.length)) : null;

  const completionRatePct =
    list.length > 0 ? Math.min(100, Math.round((100 * totals.completedLeads) / list.length)) : null;

  const pipelineByStage = STAGES.map((stage) => ({
    stage,
    label: STAGE_LABELS[stage],
    count: list.filter((l) => l.stage === stage).length,
  }));

  const platMap = new Map<string, number>();
  for (const row of list) {
    const meta = row.metadata && typeof row.metadata === "object" ? (row.metadata as Record<string, unknown>) : null;
    const label = platformLabel(row.platform as string | null, meta);
    platMap.set(label, (platMap.get(label) ?? 0) + 1);
  }
  const platformBreakdown = [...platMap.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);

  return {
    totals,
    avgLeadScore,
    pctHighQuality,
    replyProgressPct,
    proposalLinkedPct,
    completionRatePct,
    pipelineByStage,
    platformBreakdown,
  };
}
