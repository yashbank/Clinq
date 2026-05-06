import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

export const TRACKED_IMPORT_SOURCES = ["freelancer", "reddit", "github"] as const;
export type TrackedImportSourceId = (typeof TRACKED_IMPORT_SOURCES)[number];

export type SourceQualityRow = {
  source: TrackedImportSourceId;
  /** Sum of `analytics.lead_import_fetched` in window; null when no events recorded for this source. */
  fetched: number | null;
  /** Sum of `analytics.lead_import_duplicates` in window. */
  duplicates: number;
  /** Rows in scraped_leads (non-dismissed) created in window — pipeline staging volume. */
  stagedScraped: number;
  /** Scraped rows marked promoted in window (auto or manual). */
  promotedScraped: number;
  /** Processed scraped rows that were not promoted and not dismissed. */
  skippedScraped: number;
  /** User-dismissed from review in window. */
  dismissedScraped: number;
  /** promotedScraped ÷ max(1, stagedScraped), percent. */
  promotionRateFromStagedPct: number | null;
  /** promotedScraped ÷ max(1, fetched) when fetched is known. */
  promotionRateFromFetchedPct: number | null;
  /** Average Clinq score of imported leads created in window for this provider (from `leads`). */
  avgPromotedLeadScore: number | null;
};

export type SourceQualityMetrics = {
  sinceIso: string;
  days: number;
  rows: SourceQualityRow[];
};

function isTrackedSource(s: string): s is TrackedImportSourceId {
  return (TRACKED_IMPORT_SOURCES as readonly string[]).includes(s);
}

function skipIndicatesPromoted(skipReason: string | null | undefined): boolean {
  const s = (skipReason ?? "").toLowerCase();
  return s.includes("promoted to leads") || s.includes("manually promoted");
}

function skipIndicatesDismissed(skipReason: string | null | undefined, dismissedAt: string | null | undefined): boolean {
  if (dismissedAt) return true;
  const s = (skipReason ?? "").toLowerCase();
  return s.startsWith("dismissed");
}

function leadImportProviderFromMetadata(meta: Record<string, unknown>): string | null {
  const imp = meta.import && typeof meta.import === "object" && !Array.isArray(meta.import) ? (meta.import as Record<string, unknown>) : {};
  const prov = typeof imp.provider === "string" && imp.provider.trim() ? imp.provider.trim().toLowerCase() : null;
  if (prov) return prov;
  const ext = typeof meta.import_external_id === "string" ? meta.import_external_id : "";
  if (ext.includes(":")) {
    const p = ext.split(":")[0]?.toLowerCase();
    return p && p.length ? p : null;
  }
  return null;
}

/**
 * Aggregates import funnel + lead scores from `analytics`, `scraped_leads`, and `leads` only.
 */
export async function getSourceQualityMetrics(
  supabase: SupabaseClient,
  userId: string,
  options?: { days?: number },
): Promise<SourceQualityMetrics> {
  const days = Math.min(90, Math.max(1, options?.days ?? 14));
  const since = new Date(Date.now() - days * 86_400_000).toISOString();
  const sinceIso = since;

  const [{ data: scrapedRows }, { data: analyticsRows }, { data: leadRows }] = await Promise.all([
    supabase
      .from("scraped_leads")
      .select("source, processed, skip_reason, dismissed_at, created_at")
      .eq("user_id", userId)
      .gte("created_at", since)
      .limit(5000),
    supabase
      .from("analytics")
      .select("metric, value, dimensions, recorded_at")
      .eq("user_id", userId)
      .gte("recorded_at", since)
      .in("metric", ["lead_import_fetched", "lead_import_staged", "lead_import_duplicates", "lead_import_imported"])
      .limit(8000),
    supabase
      .from("leads")
      .select("score, metadata, created_at")
      .eq("user_id", userId)
      .gte("created_at", since)
      .is("deleted_at", null)
      .is("archived_at", null)
      .limit(3000),
  ]);

  const metricSums: Record<string, Record<string, number>> = {};
  const bump = (prov: string, metric: string, val: number) => {
    if (!metricSums[prov]) metricSums[prov] = {};
    metricSums[prov][metric] = (metricSums[prov][metric] ?? 0) + val;
  };

  for (const r of analyticsRows ?? []) {
    const dims = r.dimensions && typeof r.dimensions === "object" && !Array.isArray(r.dimensions) ? (r.dimensions as Record<string, unknown>) : {};
    const prov = typeof dims.provider === "string" ? dims.provider.trim().toLowerCase() : "";
    if (!prov || !isTrackedSource(prov)) continue;
    const m = typeof r.metric === "string" ? r.metric : "";
    const v = Number(r.value);
    if (!Number.isFinite(v)) continue;
    bump(prov, m, v);
  }

  const scrapeAgg: Record<
    string,
    { staged: number; promoted: number; skipped: number; dismissed: number }
  > = {};
  for (const s of TRACKED_IMPORT_SOURCES) {
    scrapeAgg[s] = { staged: 0, promoted: 0, skipped: 0, dismissed: 0 };
  }

  for (const r of scrapedRows ?? []) {
    const srcRaw = typeof r.source === "string" ? r.source.trim().toLowerCase() : "";
    if (!isTrackedSource(srcRaw)) continue;
    const dismissed = Boolean(r.dismissed_at) || skipIndicatesDismissed(r.skip_reason, r.dismissed_at);
    const promoted = skipIndicatesPromoted(r.skip_reason);
    const processed = Boolean(r.processed);

    if (dismissed) {
      scrapeAgg[srcRaw].dismissed += 1;
      continue;
    }
    scrapeAgg[srcRaw].staged += 1;
    if (promoted) scrapeAgg[srcRaw].promoted += 1;
    else if (processed) scrapeAgg[srcRaw].skipped += 1;
  }

  const scoreByProv: Record<string, { sum: number; n: number }> = {};
  for (const s of TRACKED_IMPORT_SOURCES) scoreByProv[s] = { sum: 0, n: 0 };

  for (const row of leadRows ?? []) {
    const meta = row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata) ? (row.metadata as Record<string, unknown>) : {};
    if (typeof meta.import_external_id !== "string" || !meta.import_external_id.trim()) continue;
    const prov = leadImportProviderFromMetadata(meta);
    if (!prov || !isTrackedSource(prov)) continue;
    const sc = Number(row.score);
    if (!Number.isFinite(sc)) continue;
    scoreByProv[prov].sum += sc;
    scoreByProv[prov].n += 1;
  }

  const rows: SourceQualityRow[] = TRACKED_IMPORT_SOURCES.map((source) => {
    const m = metricSums[source] ?? {};
    const fetchedSum = m.lead_import_fetched;
    const dupSum = m.lead_import_duplicates ?? 0;
    const sa = scrapeAgg[source];
    const staged = sa.staged;
    const promotedS = sa.promoted;
    const skippedS = sa.skipped;
    const dismissedS = sa.dismissed;
    const fetched = typeof fetchedSum === "number" && Number.isFinite(fetchedSum) ? fetchedSum : null;

    const promotionRateFromStagedPct =
      staged > 0 ? Math.min(100, Math.round((100 * promotedS) / staged)) : promotedS > 0 ? 100 : null;
    const promotionRateFromFetchedPct =
      fetched != null && fetched > 0 ? Math.min(100, Math.round((100 * promotedS) / fetched)) : null;

    const sn = scoreByProv[source];
    const avgPromotedLeadScore = sn.n > 0 ? Math.round((10 * sn.sum) / sn.n) / 10 : null;

    return {
      source,
      fetched: fetched != null && Number.isFinite(fetched) ? fetched : null,
      duplicates: Math.round(dupSum),
      stagedScraped: staged,
      promotedScraped: promotedS,
      skippedScraped: skippedS,
      dismissedScraped: dismissedS,
      promotionRateFromStagedPct,
      promotionRateFromFetchedPct,
      avgPromotedLeadScore,
    };
  });

  return { sinceIso, days, rows };
}
