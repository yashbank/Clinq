import "server-only";

import type { CreateLeadInput } from "@/lib/leads/create-lead-input";
import type { NormalizedScrapeRow, PublicIngestFetchContext, PublicLeadSourceAdapter } from "@/lib/leads/sources/types";
import { buildGithubSearchQueryVariants, GITHUB_SEARCH_QUERY_MAX_LENGTH } from "@/lib/leads/sources/github-search-query";

const UA = "Clinq/1.0 (https://github.com/yashbank/Clinq)";

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

function str(v: unknown, max = 8000): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  if (!t) return null;
  return t.length > max ? t.slice(0, max) : t;
}

export type GitHubIssueItem = Record<string, unknown>;

/** @deprecated use buildGithubSearchQueryVariants — kept for tests / backward imports */
export function buildGitHubOpportunitySearchQuery(userQuery: string): string {
  const v = buildGithubSearchQueryVariants(userQuery);
  return v[0]?.q ?? "is:issue is:open";
}

function logGithubSearch(scope: string, payload: Record<string, unknown>) {
  console.info(
    JSON.stringify({
      scope: `github_search.${scope}`,
      ts: new Date().toISOString(),
      ...payload,
    }),
  );
}

function githubSearchUserFacingError(args: {
  status: number;
  hadToken: boolean;
  usedFallback: boolean;
  lastAttemptLabel: string | null;
}): string {
  if (args.status === 403) {
    return args.hadToken
      ? "GitHub blocked this search (often rate limits). Wait a moment or try fewer results."
      : "GitHub Search refused this request without auth. Add a GitHub PAT under Integrations or set GITHUB_PUBLIC_IMPORT_TOKEN on the server.";
  }
  if (args.status === 422) {
    return args.usedFallback
      ? "GitHub still could not run that search after simplifying it. Try shorter keywords or a narrower topic."
      : "GitHub could not run that search (query too long, unsupported filters, or invalid syntax). Shorten your keywords and try again.";
  }
  return "GitHub Search is temporarily unavailable. Try again in a few minutes.";
}

export type GitHubSearchOk = {
  ok: true;
  items: GitHubIssueItem[];
  meta: { finalQuery: string; perPage: number; attemptLabels: string[]; usedFallback: boolean };
};

export type GitHubSearchErr = {
  ok: false;
  error: string;
  userHint: string;
};

export async function fetchGitHubSearchIssues(args: {
  query: string;
  limit: number;
  token?: string | null;
}): Promise<GitHubSearchOk | GitHubSearchErr> {
  const perPage = Math.min(30, Math.max(1, args.limit));
  const hadToken = Boolean(args.token?.trim());
  const variants = buildGithubSearchQueryVariants(args.query);
  const attemptLabels: string[] = [];
  let lastStatus = 0;
  let lastBodySnippet = "";

  const headersBase: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": UA,
  };
  const tok = args.token?.trim();
  if (tok) {
    headersBase.Authorization = `Bearer ${tok}`;
  }

  for (let i = 0; i < variants.length; i += 1) {
    const { label, q } = variants[i]!;
    attemptLabels.push(label);
    const usedFallback = i > 0;

    const qFinal = q.includes("is:issue") ? q : `${q} is:issue is:open`;
    const url = new URL("https://api.github.com/search/issues");
    url.searchParams.set("q", qFinal);
    url.searchParams.set("per_page", String(perPage));

    logGithubSearch("attempt", {
      attemptLabel: label,
      attemptIndex: i,
      queryLength: qFinal.length,
      queryMax: GITHUB_SEARCH_QUERY_MAX_LENGTH,
      perPage,
      hadToken,
      usedFallbackPath: usedFallback,
    });

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20_000);
    try {
      const res = await fetch(url.toString(), { headers: { ...headersBase }, signal: controller.signal });
      lastStatus = res.status;
      const text = await res.text();
      lastBodySnippet = text.slice(0, 400);

      if (res.status === 403) {
        logGithubSearch("response", { status: res.status, attemptLabel: label, perPage, usedFallbackPath: usedFallback });
        return {
          ok: false,
          error: "GitHub Search HTTP 403",
          userHint: githubSearchUserFacingError({ status: 403, hadToken, usedFallback, lastAttemptLabel: label }),
        };
      }

      if (res.status === 422) {
        logGithubSearch("response_422", {
          attemptLabel: label,
          queryLength: qFinal.length,
          bodySnippet: lastBodySnippet,
          willRetry: i < variants.length - 1,
        });
        if (i < variants.length - 1) continue;
        return {
          ok: false,
          error: "GitHub Search HTTP 422",
          userHint: githubSearchUserFacingError({ status: 422, hadToken, usedFallback: i > 0, lastAttemptLabel: label }),
        };
      }

      if (!res.ok) {
        logGithubSearch("response_error", { status: res.status, attemptLabel: label });
        return {
          ok: false,
          error: `GitHub Search HTTP ${res.status}`,
          userHint: githubSearchUserFacingError({ status: res.status, hadToken, usedFallback, lastAttemptLabel: label }),
        };
      }

      let json: unknown;
      try {
        json = JSON.parse(text) as unknown;
      } catch {
        return { ok: false, error: "GitHub returned non-JSON", userHint: "GitHub returned an unexpected response. Try again." };
      }
      const root = asRecord(json);
      const itemsRaw = root && Array.isArray(root.items) ? root.items : [];

      logGithubSearch("success", {
        finalQuery: qFinal,
        finalQueryLength: qFinal.length,
        perPage,
        attemptLabels: attemptLabels.join("→"),
        usedFallbackPath: i > 0,
        itemCount: itemsRaw.length,
      });

      return {
        ok: true,
        items: itemsRaw as GitHubIssueItem[],
        meta: {
          finalQuery: qFinal,
          perPage,
          attemptLabels,
          usedFallback: i > 0,
        },
      };
    } catch (e) {
      const msg = e instanceof Error && e.name === "AbortError" ? "GitHub request timed out" : e instanceof Error ? e.message : "GitHub fetch failed";
      return { ok: false, error: msg, userHint: msg };
    } finally {
      clearTimeout(timer);
    }
  }

  return {
    ok: false,
    error: `GitHub Search HTTP ${lastStatus || 0}`,
    userHint: githubSearchUserFacingError({
      status: lastStatus || 422,
      hadToken,
      usedFallback: attemptLabels.length > 1,
      lastAttemptLabel: attemptLabels[attemptLabels.length - 1] ?? null,
    }),
  };
}

export function normalizeGitHubIssue(issue: GitHubIssueItem, importedAtIso: string): NormalizedScrapeRow | null {
  const numId = typeof issue.id === "number" && Number.isFinite(issue.id) ? issue.id : null;
  if (numId == null) return null;
  const title = str(issue.title, 500) ?? "Untitled issue";
  const body = str(issue.body, 16000) ?? "";
  const htmlUrl = str(issue.html_url, 2000);
  if (!htmlUrl) return null;
  const user = asRecord(issue.user);
  const login = user ? str(user.login, 120) : null;
  const repoRec = asRecord(issue.repository);
  let fullName = repoRec ? str(repoRec.full_name, 200) : null;
  if (!fullName) {
    const ru = str(issue.repository_url, 500);
    if (ru?.includes("/repos/")) {
      try {
        const path = new URL(ru).pathname.replace(/^\/repos\//i, "").replace(/\/$/, "");
        fullName = path || null;
      } catch {
        fullName = null;
      }
    }
  }

  const labelNames: string[] = [];
  const labels = issue.labels;
  if (Array.isArray(labels)) {
    for (const lb of labels) {
      const lr = asRecord(lb);
      const n = lr ? str(lr.name, 120) : null;
      if (n) labelNames.push(n);
    }
  }

  const desc = [body, fullName ? `Repository: ${fullName}` : null].filter(Boolean).join("\n\n").slice(0, 16000) || title;

  const input: CreateLeadInput = {
    client_name: login?.length ? login.slice(0, 120) : "GitHub",
    project_title: title.slice(0, 500),
    project_url: htmlUrl,
    source: "github",
    platform: "GitHub",
    project_description: desc,
    repeat_hire: false,
    competition_level: 3,
    project_quality: body.length > 100 ? 4 : 2,
    proposal_match_notes: labelNames.length ? `Labels: ${labelNames.slice(0, 12).join(", ")}` : undefined,
  };

  const importExternalId = `github:issue:${numId}`;
  const metadataExtra: Record<string, unknown> = {
    import_external_id: importExternalId,
    import: {
      provider: "github",
      external_id: String(numId),
      imported_at: importedAtIso,
      url: htmlUrl,
      tags: [...labelNames, "github"].filter(Boolean),
      raw_snapshot: {
        id: numId,
        repository: fullName,
      },
    },
  };

  return { input, metadataExtra };
}

export function githubDedupeKeyFromIssue(issue: GitHubIssueItem): string | null {
  const numId = typeof issue.id === "number" && Number.isFinite(issue.id) ? issue.id : null;
  return numId != null ? `github:issue:${numId}` : null;
}

export const githubPublicAdapter: PublicLeadSourceAdapter = {
  id: "github",
  label: "GitHub (public issue search)",
  async fetchRaw(args, context?: PublicIngestFetchContext) {
    const envTok = process.env.GITHUB_PUBLIC_IMPORT_TOKEN?.trim() || null;
    const token = (context?.githubToken?.trim() || envTok) || null;
    const r = await fetchGitHubSearchIssues({
      query: args.query,
      limit: args.limit,
      token,
    });
    if (!r.ok) {
      return { ok: false, error: r.userHint };
    }
    return { ok: true, items: r.items as unknown[] };
  },
  normalize(raw, importedAtIso) {
    const d = asRecord(raw);
    if (!d) return null;
    return normalizeGitHubIssue(d as GitHubIssueItem, importedAtIso);
  },
  dedupeKeyFromRaw(raw) {
    const d = asRecord(raw);
    if (!d) return null;
    return githubDedupeKeyFromIssue(d as GitHubIssueItem);
  },
};
