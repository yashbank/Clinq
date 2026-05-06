import type { PublicIngestSourceId, PublicLeadSourceAdapter } from "@/lib/leads/sources/types";

export type { PublicIngestSourceId } from "@/lib/leads/sources/types";
import { githubPublicAdapter } from "@/lib/leads/sources/github-public";
import { redditPublicAdapter } from "@/lib/leads/sources/reddit-public";

const byId: Record<PublicIngestSourceId, PublicLeadSourceAdapter> = {
  reddit: redditPublicAdapter,
  github: githubPublicAdapter,
};

export function getPublicIngestAdapter(id: PublicIngestSourceId): PublicLeadSourceAdapter {
  return byId[id];
}

export const PUBLIC_INGEST_SOURCE_IDS: PublicIngestSourceId[] = ["reddit", "github"];
