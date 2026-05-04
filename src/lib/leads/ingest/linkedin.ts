import type { LeadIngestResult } from "@/lib/leads/ingest/types";

/** Reserved for LinkedIn message / job thread parsing. */
export function ingestLinkedInPlaceholder(): LeadIngestResult {
  return { ok: false, error: "LinkedIn import is not connected yet. Use manual lead capture." };
}
