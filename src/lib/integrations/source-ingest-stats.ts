import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

const MS_DAY = 86_400_000;

export type SourceIngestStats = {
  sinceIso: string;
  scrapedBySource: Record<string, { total: number; promoted: number; skipped: number }>;
  leadsByImportProvider: Record<string, number>;
};

function bump(m: Record<string, number>, k: string, n = 1) {
  m[k] = (m[k] ?? 0) + n;
}

/**
 * Real counts only — small recent window, aggregated in memory (no fake chart data).
 */
export async function getSourceIngestStats(supabase: SupabaseClient, userId: string): Promise<SourceIngestStats> {
  const since = new Date(Date.now() - 14 * MS_DAY).toISOString();
  const sinceIso = since;

  const { data: scrapedRows } = await supabase
    .from("scraped_leads")
    .select("source, processed, skip_reason")
    .eq("user_id", userId)
    .gte("created_at", since)
    .limit(2000);

  const scrapedBySource: Record<string, { total: number; promoted: number; skipped: number }> = {};

  for (const r of scrapedRows ?? []) {
    const src = typeof r.source === "string" && r.source.trim() ? r.source.trim() : "unknown";
    if (!scrapedBySource[src]) scrapedBySource[src] = { total: 0, promoted: 0, skipped: 0 };
    scrapedBySource[src].total += 1;
    const sr = typeof r.skip_reason === "string" ? r.skip_reason : "";
    if (sr.includes("Promoted")) scrapedBySource[src].promoted += 1;
    else if (r.processed) scrapedBySource[src].skipped += 1;
  }

  const { data: leadRows } = await supabase
    .from("leads")
    .select("metadata")
    .eq("user_id", userId)
    .gte("created_at", since)
    .is("deleted_at", null)
    .is("archived_at", null)
    .limit(1500);

  const leadsByImportProvider: Record<string, number> = {};

  for (const row of leadRows ?? []) {
    const meta = row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata) ? (row.metadata as Record<string, unknown>) : {};
    const imp = meta.import && typeof meta.import === "object" && !Array.isArray(meta.import) ? (meta.import as Record<string, unknown>) : {};
    const prov = typeof imp.provider === "string" && imp.provider.trim() ? imp.provider.trim().toLowerCase() : null;
    if (prov) bump(leadsByImportProvider, prov);
    else if (typeof meta.import_external_id === "string" && meta.import_external_id.includes(":")) {
      const p = meta.import_external_id.split(":")[0]?.toLowerCase();
      if (p) bump(leadsByImportProvider, p);
    } else {
      bump(leadsByImportProvider, "manual_or_untagged");
    }
  }

  return { sinceIso, scrapedBySource, leadsByImportProvider };
}
