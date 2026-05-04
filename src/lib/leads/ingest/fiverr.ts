import type { LeadIngestResult } from "@/lib/leads/ingest/types";

/** Reserved for Fiverr gig URL / message ingestion. */
export function ingestFiverrPlaceholder(): LeadIngestResult {
  return { ok: false, error: "Fiverr import is not connected yet. Use manual lead capture." };
}
