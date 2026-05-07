/**
 * GitHub REST Search issues `q` parameter constraints.
 * Invalid qualifiers (e.g. `in:title,in:body`) and over-long strings return HTTP 422.
 * @see https://docs.github.com/en/rest/search/search?apiVersion=2022-11-28#search-issues-and-pull-requests
 */
export const GITHUB_SEARCH_QUERY_MAX_LENGTH = 256;

function collapseWhitespace(q: string): string {
  return q.replace(/\s+/g, " ").trim();
}

/** Strip characters that often break GitHub query parsing when pasted from URLs. */
export function sanitizeGitHubUserQueryFragment(raw: string): string {
  let s = collapseWhitespace(raw);
  s = s.replace(/["`]/g, " ");
  return collapseWhitespace(s).slice(0, 140);
}

export type GithubSearchQueryVariant = { label: "primary" | "simplified" | "minimal"; q: string };

function truncateQuery(q: string, max = GITHUB_SEARCH_QUERY_MAX_LENGTH): string {
  const t = collapseWhitespace(q);
  if (t.length <= max) return t;
  return t.slice(0, max - 1).trimEnd();
}

/**
 * Ordered search strings: start opportunity-focused, then safer fallbacks for 422.
 * Never uses invalid `in:title,in:body` (comma form is rejected by GitHub → 422).
 */
export function buildGithubSearchQueryVariants(userQuery: string): GithubSearchQueryVariant[] {
  const core = sanitizeGitHubUserQueryFragment(userQuery);
  if (!core) {
    return [{ label: "minimal", q: "is:issue is:open" }];
  }

  const compactSignals = "(hire OR hiring OR freelance OR contract OR paid OR gig)";
  const primary = truncateQuery(`${core} is:issue is:open archived:false ${compactSignals}`);
  const simplified = truncateQuery(`${core} is:issue is:open archived:false`);
  const words = core.split(" ").filter(Boolean).slice(0, 6);
  const minimal = truncateQuery(`${words.join(" ")} is:issue is:open`);

  const out: GithubSearchQueryVariant[] = [];
  const seen = new Set<string>();
  for (const cand of [
    { label: "primary" as const, q: primary },
    { label: "simplified" as const, q: simplified },
    { label: "minimal" as const, q: minimal },
  ]) {
    const q = collapseWhitespace(cand.q);
    if (!q || seen.has(q)) continue;
    seen.add(q);
    out.push({ label: cand.label, q });
  }
  return out.length ? out : [{ label: "minimal", q: "is:issue is:open" }];
}
