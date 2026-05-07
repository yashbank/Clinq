import type { PublicIngestResult } from "@/actions/public-source-ingest";

/** User-facing import summary lines (deterministic; no fabricated counts). */
export function publicIngestResultLines(res: PublicIngestResult): string[] {
  return [
    `Fetched ${res.fetched_count} from the API`,
    `New staged rows: ${res.scraped_staged_count}`,
    `Promoted to Leads: ${res.promoted_count}`,
    `Already had (duplicate): ${res.duplicate_count}`,
    `Could not parse / save to staging: ${res.skipped_invalid_count}`,
    `Filtered by relevance: ${res.skipped_irrelevant_count}`,
    `Promote save failed: ${res.skipped_persist_failed_count}`,
  ];
}

export function publicIngestToastDescription(res: PublicIngestResult): string {
  const base = publicIngestResultLines(res).join(" · ");
  if (!res.errors.length) return base;
  const hint = res.errors
    .slice(0, 2)
    .map((e) => e.replace(/\s+/g, " ").trim().slice(0, 120))
    .join(" · ");
  return `${base}. Notes: ${hint}${res.errors.length > 2 ? " · …" : ""}`;
}
