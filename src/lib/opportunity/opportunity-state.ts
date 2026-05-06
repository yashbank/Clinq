import "server-only";

import { hoursSinceLeadActivity } from "@/lib/ai/lead-priority";
import type { LeadRow, PipelineStage } from "@/types/database";

export type LeadOpportunityStateId =
  | "needs_proposal"
  | "needs_follow_up"
  | "strong_fit_act_soon"
  | "stale_high_value"
  | "steady";

export type LeadOpportunityState = {
  id: LeadOpportunityStateId;
  label: string;
  why: string;
};

function isImported(lead: LeadRow): boolean {
  return Boolean(lead.is_imported_lead);
}

const REPLY_STAGES: PipelineStage[] = ["replied", "interview", "active"];

/**
 * Single primary state + one-line explanation for dashboard / prioritization hints.
 */
export function computeLeadOpportunityState(
  lead: LeadRow,
  ctx: {
    hasProposal: boolean;
    openFollowUpCount: number;
    sourceSignals?: { bestPromotionSource?: string | null } | null;
  },
): LeadOpportunityState {
  const score = Number(lead.score) || 0;
  const hours = hoursSinceLeadActivity(lead);
  const stage = lead.stage as PipelineStage;
  const imported = isImported(lead);

  if (lead.interest_status === "interested" || (score >= 78 && hours <= 72 && (stage === "saved" || stage === "applied"))) {
    const srcHint = ctx.sourceSignals?.bestPromotionSource;
    return {
      id: "strong_fit_act_soon",
      label: "Strong fit · act soon",
      why:
        lead.interest_status === "interested"
          ? "Marked interested — prioritize while context is fresh."
          : srcHint
            ? `Top score with recent activity; ${srcHint} imports have been converting well.`
            : "Top score with very recent activity — worth a fast pass.",
    };
  }

  if ((stage === "saved" || stage === "applied") && !ctx.hasProposal && (imported || score >= 68) && score >= 58) {
    return {
      id: "needs_proposal",
      label: "Needs proposal",
      why: imported
        ? "Imported lead in an active stage with no linked proposal yet."
        : "High enough score with no proposal logged — capture your angle.",
    };
  }

  if (REPLY_STAGES.includes(stage) && hours > 5 * 24 && ctx.openFollowUpCount < 1) {
    return {
      id: "needs_follow_up",
      label: "Needs follow-up",
      why: "Pipeline stage advanced but no open follow-up reminder on this lead.",
    };
  }

  if (stage === "saved" && score >= 74 && hours > 10 * 24 && !ctx.hasProposal) {
    return {
      id: "stale_high_value",
      label: "Stale but high-value",
      why: "Still in Saved with a strong score but quiet for 10+ days — decide or draft.",
    };
  }

  return {
    id: "steady",
    label: "On track",
    why: "No urgent signal from score, proposals, follow-ups, or recency.",
  };
}

/** Optional: best import source by promotion rate from dashboard metrics row. */
export function bestPromotionSourceLabel(rows: { source: string; promotionRateFromFetchedPct: number | null; promotionRateFromStagedPct: number | null }[]): string | null {
  let best: { source: string; rate: number } | null = null;
  for (const r of rows) {
    const rate = r.promotionRateFromFetchedPct ?? r.promotionRateFromStagedPct ?? 0;
    if (rate <= 0) continue;
    if (!best || rate > best.rate) best = { source: r.source, rate };
  }
  return best?.source ?? null;
}
