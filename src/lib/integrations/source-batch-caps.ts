import type { PublicIngestSourceId } from "@/lib/leads/sources/types";

/** Freelancer active-project fetch: stay within conservative API batch sizes. */
export const FREELANCER_IMPORT_DEFAULT = 15;
export const FREELANCER_IMPORT_MAX = 30;

/** GitHub Search API: unauthenticated quota is tight. */
export const GITHUB_PUBLIC_NO_TOKEN_MAX = 15;
export const GITHUB_PUBLIC_WITH_TOKEN_MAX = 30;

/** Reddit listing search via OAuth. */
export const REDDIT_OAUTH_IMPORT_MAX = 25;

export function clampFreelancerImportLimit(limit: number | undefined): number {
  const n = typeof limit === "number" && Number.isFinite(limit) ? Math.floor(limit) : FREELANCER_IMPORT_DEFAULT;
  return Math.min(FREELANCER_IMPORT_MAX, Math.max(1, n));
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
