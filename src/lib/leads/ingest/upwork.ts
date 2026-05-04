import type { LeadIngestResult } from "@/lib/leads/ingest/types";

/** Reserved for Upwork job URL / HTML parsing — wire when API or export is available. */
export function ingestUpworkPlaceholder(): LeadIngestResult {
  return { ok: false, error: "Upwork import is not connected yet. Use manual lead capture." };
}
