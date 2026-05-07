import type { SupabaseClient } from "@supabase/supabase-js";

/** PostgREST / Postgres messages when `relevance_score` is not on `scraped_leads`. */
export function isMissingRelevanceScoreColumnError(message: string | undefined | null): boolean {
  const m = (message ?? "").toLowerCase();
  if (!m.includes("relevance_score")) return false;
  return (
    m.includes("does not exist") ||
    m.includes("column") ||
    m.includes("schema cache") ||
    m.includes("could not find")
  );
}

/**
 * Probes whether `scraped_leads.relevance_score` exists (migration applied).
 * Safe when the table is empty.
 */
export async function detectScrapedLeadsRelevanceScoreSupport(supabase: SupabaseClient): Promise<boolean> {
  const { error } = await supabase.from("scraped_leads").select("relevance_score").limit(1);
  if (error && isMissingRelevanceScoreColumnError(error.message)) return false;
  return true;
}

export const SCRAPED_LEADS_RELEVANCE_MIGRATION_HINT =
  "Apply pending Supabase migrations (e.g. scraped_leads relevance_score) so scoring filters and promotion metadata stay in sync.";
