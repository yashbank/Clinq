import type { PublicIngestSourceId } from "@/lib/leads/sources/types";

/** Freelancer active-project fetch: per-request API max is 50; total per run is capped for safety. */
export const FREELANCER_IMPORT_DEFAULT = 25;
/** Max projects/active rows to request in one import run (may span multiple API pages). */
export const FREELANCER_IMPORT_MAX_TOTAL = 100;
/** Single GET /projects/active/ page size (Freelancer API allows up to 50). */
export const FREELANCER_API_PAGE_SIZE = 50;
/** Hard cap on API round-trips per import to avoid accidental hammering. */
export const FREELANCER_IMPORT_MAX_PAGES = 4;

/** @deprecated use FREELANCER_IMPORT_MAX_TOTAL — kept for UI imports that referenced the old name */
export const FREELANCER_IMPORT_MAX = FREELANCER_IMPORT_MAX_TOTAL;

/** GitHub Search API: unauthenticated quota is tight. */
export const GITHUB_PUBLIC_NO_TOKEN_MAX = 15;
export const GITHUB_PUBLIC_WITH_TOKEN_MAX = 30;

/** Reddit listing search via OAuth. */
export const REDDIT_OAUTH_IMPORT_MAX = 25;

export function clampFreelancerImportLimit(limit: number | undefined): number {
  const n = typeof limit === "number" && Number.isFinite(limit) ? Math.floor(limit) : FREELANCER_IMPORT_DEFAULT;
  return Math.min(FREELANCER_IMPORT_MAX_TOTAL, Math.max(1, n));
}

/** Ordered Freelancer API pages: offset + limit per request until totalWanted is covered or max pages. */
export function computeFreelancerImportPagePlan(totalWanted: number): { offset: number; pageSize: number }[] {
  const total = Math.min(FREELANCER_IMPORT_MAX_TOTAL, Math.max(1, Math.floor(totalWanted)));
  const pages: { offset: number; pageSize: number }[] = [];
  let offset = 0;
  let remaining = total;
  for (let i = 0; i < FREELANCER_IMPORT_MAX_PAGES && remaining > 0; i += 1) {
    const pageSize = Math.min(FREELANCER_API_PAGE_SIZE, remaining);
    pages.push({ offset, pageSize });
    offset += pageSize;
    remaining -= pageSize;
  }
  return pages;
}

export type PublicIngestCapInfo = {
  maxPerRun: number;
  disabled: boolean;
  summary: string;
};

export function publicIngestCapForSource(
  source: PublicIngestSourceId,
  opts: { redditOAuthConfigured: boolean; githubHasElevatedToken: boolean },
): PublicIngestCapInfo {
  if (source === "reddit") {
    if (!opts.redditOAuthConfigured) {
      return {
        maxPerRun: 0,
        disabled: true,
        summary: "Reddit import is off until REDDIT_OAUTH_ACCESS_TOKEN is set on the server (official Reddit API OAuth).",
      };
    }
    return {
      maxPerRun: REDDIT_OAUTH_IMPORT_MAX,
      disabled: false,
      summary: `Reddit (OAuth): up to ${REDDIT_OAUTH_IMPORT_MAX} posts per run, paginated client-side within one search response.`,
    };
  }
  if (opts.githubHasElevatedToken) {
    return {
      maxPerRun: GITHUB_PUBLIC_WITH_TOKEN_MAX,
      disabled: false,
      summary: `GitHub Search: up to ${GITHUB_PUBLIC_WITH_TOKEN_MAX} issues per run with a token (user PAT or server GITHUB_PUBLIC_IMPORT_TOKEN).`,
    };
  }
  return {
    maxPerRun: GITHUB_PUBLIC_NO_TOKEN_MAX,
    disabled: false,
    summary: `GitHub Search: up to ${GITHUB_PUBLIC_NO_TOKEN_MAX} issues per run without a token (public rate limits). Add a fine-grained PAT in Integrations for higher throughput.`,
  };
}
