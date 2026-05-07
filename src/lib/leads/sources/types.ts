import type { CreateLeadInput } from "@/lib/leads/create-lead-input";

/** Canonical shape after normalizing a raw row from any ingest adapter. */
export type NormalizedScrapeRow = {
  input: CreateLeadInput;
  metadataExtra: Record<string, unknown>;
};

/** Supported multi-source public-ingest adapters (no direct `leads` writes). */
export type PublicIngestSourceId = "reddit" | "github";

/** Optional server-side credentials (never echoed to the client). */
export type PublicIngestFetchContext = {
  /** GitHub Search API bearer (user vault PAT and/or deployment token). */
  githubToken?: string | null;
};

export interface PublicLeadSourceAdapter {
  readonly id: PublicIngestSourceId;
  /** Human label for UI and logs. */
  readonly label: string;
  /**
   * Fetch raw provider payloads (official APIs only).
   * @param query User search string (passed to provider search).
   */
  fetchRaw(
    args: { query: string; limit: number },
    context?: PublicIngestFetchContext,
  ): Promise<{ ok: true; items: unknown[] } | { ok: false; error: string }>;
  /** Normalize one raw item; return null if unusable. */
  normalize(raw: unknown, importedAtIso: string): NormalizedScrapeRow | null;
  /** Stable dedupe id stored in `raw_data.import_external_id` and `metadata.import_external_id`. */
  dedupeKeyFromRaw(raw: unknown): string | null;
}
