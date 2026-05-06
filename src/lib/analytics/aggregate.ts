import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { LeadRow, PipelineStage } from "@/types/database";

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

const MS_DAY = 86_400_000;

function platformLabel(platform: string | null, metadata: Record<string, unknown> | null): string {
  const src = typeof metadata?.source === "string" ? metadata.source.trim() : "";
  const p = platform?.trim();
  if (p) return p;
  if (src) return src;
  return "Unspecified";
}

function isImportedMeta(metadata: unknown): boolean {
  const m = metadata && typeof metadata === "object" && !Array.isArray(metadata) ? (metadata as Record<string, unknown>) : {};
  return typeof m.import_external_id === "string" && m.import_external_id.length > 0;
}

function scoreBand(score: number): string {
  if (score >= 75) return "75–100";
  if (score >= 50) return "50–74";
  if (score >= 25) return "25–49";
  return "0–24";
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
  /** Score histogram buckets from real lead scores. */
  scoreDistribution: { band: string; count: number }[];
  /** Manual vs API-imported lead rows (import_external_id present). */
  sourceOriginSplit: { label: string; count: number }[];
  /** Proposals created in the last 30 days vs the prior 30 days (from `created_at`). */
  proposalsLast30d: number;
  proposalsPrev30d: number;
  /** % of completed leads that have at least one proposal referencing them. */
  completedWithProposalPct: number | null;
  /** `stage_changed` activities in the last ~28 days, grouped into four 7-day buckets (oldest → newest). */
  pipelineMoveTrend: { label: string; count: number }[];
  /** Open follow-up reminder activities (status not done). */
  openFollowUpReminders: number;
  /** Total stage_changed activities counted in pipelineMoveTrend. */
  pipelineStageChanges28d: number;
};

export async function getAnalyticsSnapshot(): Promise<AnalyticsSnapshot | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const since = new Date(Date.now() - 35 * MS_DAY).toISOString();

  const [{ data: leads }, { data: proposals }, { data: stageActs }, { data: followUpActs }] = await Promise.all([
    supabase.from("leads").select("id, stage, score, platform, metadata").is("deleted_at", null).is("archived_at", null),
    supabase.from("proposals").select("id, lead_id, created_at"),
    supabase
      .from("activities")
      .select("created_at, type")
      .eq("user_id", user.id)
      .eq("type", "stage_changed")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(500),
    supabase
      .from("activities")
      .select("metadata")
      .eq("user_id", user.id)
      .eq("type", "follow_up_reminder")
      .order("created_at", { ascending: false })
      .limit(400),
  ]);

  const list = (leads ?? []) as Pick<LeadRow, "id" | "stage" | "score" | "platform" | "metadata">[];
  const props = proposals ?? [];
  const acts = stageActs ?? [];

  let openFollowUpReminders = 0;
  for (const row of followUpActs ?? []) {
    const meta = row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata)
      ? (row.metadata as Record<string, unknown>)
      : {};
    const st = typeof meta.status === "string" ? meta.status.toLowerCase() : "";
    if (st !== "done") openFollowUpReminders += 1;
  }

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

  const bandOrder = ["0–24", "25–49", "50–74", "75–100"];
  const bandCounts = new Map<string, number>(bandOrder.map((b) => [b, 0]));
  for (const row of list) {
    const b = scoreBand(Number(row.score) || 0);
    bandCounts.set(b, (bandCounts.get(b) ?? 0) + 1);
  }
  const scoreDistribution = bandOrder.map((band) => ({ band, count: bandCounts.get(band) ?? 0 }));

  let importedN = 0;
  for (const row of list) {
    if (isImportedMeta(row.metadata)) importedN += 1;
  }
  const manualN = Math.max(0, list.length - importedN);
  const sourceOriginSplit = [
    { label: "Manual entry", count: manualN },
    { label: "Imported", count: importedN },
  ];

  const now = Date.now();
  const t30 = now - 30 * MS_DAY;
  const t60 = now - 60 * MS_DAY;
  let proposalsLast30d = 0;
  let proposalsPrev30d = 0;
  for (const p of props) {
    const t = new Date(p.created_at as string).getTime();
    if (Number.isNaN(t)) continue;
    if (t >= t30) proposalsLast30d += 1;
    else if (t >= t60 && t < t30) proposalsPrev30d += 1;
  }

  const completedIds = new Set(list.filter((l) => l.stage === "completed").map((l) => l.id));
  const completedWithProposalSet = new Set<string>();
  if (completedIds.size > 0) {
    for (const p of props) {
      const lid = p.lead_id as string | null;
      if (lid && completedIds.has(lid)) {
        completedWithProposalSet.add(lid);
      }
    }
  }
  const completedWithProposal = completedWithProposalSet.size;
  const completedWithProposalPct =
    completedIds.size > 0 ? Math.min(100, Math.round((100 * completedWithProposal) / completedIds.size)) : null;

  const bucketCounts = [0, 0, 0, 0];
  for (const a of acts) {
    const t = new Date(a.created_at as string).getTime();
    if (Number.isNaN(t)) continue;
    const age = now - t;
    const idx = Math.floor(age / (7 * MS_DAY));
    if (idx >= 0 && idx < 4) {
      bucketCounts[3 - idx] += 1;
    }
  }
  const pipelineMoveTrend = [
    { label: "Week −3", count: bucketCounts[0] },
    { label: "Week −2", count: bucketCounts[1] },
    { label: "Week −1", count: bucketCounts[2] },
    { label: "This week", count: bucketCounts[3] },
  ];
  const pipelineStageChanges28d = bucketCounts.reduce((s, n) => s + n, 0);

  return {
    totals,
    avgLeadScore,
    pctHighQuality,
    replyProgressPct,
    proposalLinkedPct,
    completionRatePct,
    pipelineByStage,
    platformBreakdown,
    scoreDistribution,
    sourceOriginSplit,
    proposalsLast30d,
    proposalsPrev30d,
    completedWithProposalPct,
    pipelineMoveTrend,
    openFollowUpReminders,
    pipelineStageChanges28d,
  };
}
