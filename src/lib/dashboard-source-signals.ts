import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { getSourceQualityMetrics, type SourceQualityMetrics, type SourceQualityRow } from "@/lib/integrations/source-quality-metrics";

function skipIndicatesPromoted(skipReason: string | null | undefined): boolean {
  const s = (skipReason ?? "").toLowerCase();
  return s.includes("promoted to leads") || s.includes("manually promoted");
}

function isDismissedScraped(skipReason: string | null | undefined, dismissedAt: string | null | undefined): boolean {
  if (dismissedAt) return true;
  return (skipReason ?? "").toLowerCase().startsWith("dismissed");
}

export type DashboardSourceBullet = {
  label: string;
  detail: string;
  href: string;
};

export type DashboardSourceSignals = {
  sinceIso: string;
  metrics7d: SourceQualityMetrics;
  highRelevanceSkippedCount: number;
  importedSavedNoProposalCount: number;
  bullets: DashboardSourceBullet[];
};

function pickBestByPromotionRate(rows: SourceQualityRow[]): SourceQualityRow | null {
  const scored = rows
    .map((r) => {
      const rate = r.promotionRateFromFetchedPct ?? r.promotionRateFromStagedPct;
      return rate != null ? { r, rate } : null;
    })
    .filter((x): x is { r: SourceQualityRow; rate: number } => x != null && x.rate > 0);
  if (!scored.length) return null;
  scored.sort((a, b) => b.rate - a.rate);
  return scored[0]!.r;
}

function pickBestByVolume(rows: SourceQualityRow[]): SourceQualityRow | null {
  const sorted = [...rows].sort((a, b) => b.promotedScraped - a.promotedScraped);
  return sorted[0] && sorted[0].promotedScraped > 0 ? sorted[0] : null;
}

/**
 * Compact, deterministic dashboard copy from import metrics + scraped review state.
 */
export async function getDashboardSourceSignals(
  supabase: SupabaseClient,
  userId: string,
  args: {
    proposalLeadIds: Set<string>;
    /** Recent lead ids with score + stage for “needs proposal” heuristic. */
    leadHints: Array<{ id: string; score: number; stage: string }>;
  },
): Promise<DashboardSourceSignals> {
  const since = new Date(Date.now() - 7 * 86_400_000).toISOString();
  const [metrics7d, { data: scrapedScan }] = await Promise.all([
    getSourceQualityMetrics(supabase, userId, { days: 7 }),
    supabase
      .from("scraped_leads")
      .select("skip_reason, relevance_score, processed, dismissed_at")
      .eq("user_id", userId)
      .gte("created_at", since)
      .limit(1200),
  ]);

  let highRelevanceSkippedCount = 0;
  for (const r of scrapedScan ?? []) {
    if (isDismissedScraped(r.skip_reason, r.dismissed_at)) continue;
    if (!r.processed) continue;
    if (skipIndicatesPromoted(r.skip_reason)) continue;
    const rel = Number(r.relevance_score);
    if (!Number.isFinite(rel) || rel < 62) continue;
    highRelevanceSkippedCount += 1;
  }

  const importedSavedNoProposalCount = args.leadHints.filter(
    (l) => l.stage === "saved" && l.score >= 72 && l.id && !args.proposalLeadIds.has(l.id),
  ).length;

  const bestRate = pickBestByPromotionRate(metrics7d.rows);
  const bestVol = pickBestByVolume(metrics7d.rows);
  const bullets: DashboardSourceBullet[] = [];

  if (bestVol && bestVol.promotedScraped > 0) {
    bullets.push({
      label: "Most promoted this week",
      detail: `${bestVol.source}: ${bestVol.promotedScraped} from staging (7d).`,
      href: "/integrations",
    });
  }
  if (bestRate && (bestRate.promotionRateFromFetchedPct != null || bestRate.promotionRateFromStagedPct != null)) {
    const pct = bestRate.promotionRateFromFetchedPct ?? bestRate.promotionRateFromStagedPct;
    if (pct != null && pct > 0 && (!bestVol || bestRate.source !== bestVol.source)) {
      bullets.push({
        label: "Highest promotion rate",
        detail: `${bestRate.source}: ${pct}% of staged or fetched rows promoted (7d).`,
        href: "/integrations",
      });
    }
  }
  if (highRelevanceSkippedCount > 0) {
    bullets.push({
      label: "Skipped imports worth a look",
      detail: `${highRelevanceSkippedCount} processed row(s) scored ≥62 but not auto-promoted.`,
      href: "/integrations/scraped?state=skipped&minScore=62",
    });
  }
  if (importedSavedNoProposalCount > 0) {
    bullets.push({
      label: "Imported leads — no proposal yet",
      detail: `${importedSavedNoProposalCount} saved lead(s) at score ≥72 with no linked proposal.`,
      href: "/proposals",
    });
  }

  return {
    sinceIso: since,
    metrics7d,
    highRelevanceSkippedCount,
    importedSavedNoProposalCount,
    bullets: bullets.slice(0, 4),
  };
}
