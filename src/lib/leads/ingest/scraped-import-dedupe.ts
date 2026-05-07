import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * External ids already present in scraped_leads for this user+source (any age / processed state).
 * Used so repeat imports do not create duplicate staging rows.
 */
export async function loadScrapedImportExternalIdsForSource(
  supabase: SupabaseClient,
  userId: string,
  source: string,
): Promise<Set<string>> {
  const out = new Set<string>();
  const { data, error } = await supabase
    .from("scraped_leads")
    .select("raw_data")
    .eq("user_id", userId)
    .eq("source", source)
    .order("created_at", { ascending: false })
    .limit(2500);

  if (error || !data) return out;

  for (const row of data) {
    const raw = row.raw_data;
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) continue;
    const ext = (raw as Record<string, unknown>).import_external_id;
    if (typeof ext === "string" && ext.trim()) out.add(ext.trim());
  }
  return out;
}
