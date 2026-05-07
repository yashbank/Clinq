import "server-only";

import type { CreateLeadInput } from "@/lib/leads/create-lead-input";
import type { NormalizedScrapeRow, PublicIngestFetchContext, PublicLeadSourceAdapter } from "@/lib/leads/sources/types";

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

/**
 * Bias GitHub issue search toward hiring / paid work without replacing the user's keywords.
 */
export function buildGitHubOpportunitySearchQuery(userQuery: string): string {
  const core = userQuery.trim();
  if (!core) return core;
  const hiringSignals = "(hire OR hiring OR freelance OR freelancer OR contract OR contractor OR paid OR bounty OR gig OR \"looking for\")";
  return `${core} is:issue is:open archived:false ${hiringSignals} in:title,in:body`;
}

export async function fetchGitHubSearchIssues(args: {
  query: string;
  limit: number;
  token?: string | null;
}): Promise<{ ok: true; items: GitHubIssueItem[] } | { ok: false; error: string }> {
  const q = args.query.trim();
  if (!q) {
    return { ok: false, error: "Search query is required" };
  }
  const perPage = Math.min(30, Math.max(1, args.limit));
  const url = new URL("https://api.github.com/search/issues");
  url.searchParams.set("q", q.includes("is:issue") ? q : `${q} is:issue is:open`);
  url.searchParams.set("per_page", String(perPage));

  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": UA,
  };
  const tok = args.token?.trim();
  if (tok) {
    headers.Authorization = `Bearer ${tok}`;
  }

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 20_000);
  try {
    const res = await fetch(url.toString(), { headers, signal: controller.signal });
    const text = await res.text();
    if (res.status === 403) {
      return {
        ok: false,
        error:
          "GitHub Search refused this request (often rate limits without auth). Add a GitHub PAT under Integrations or set GITHUB_PUBLIC_IMPORT_TOKEN on the server.",
      };
    }
    if (!res.ok) {
      return { ok: false, error: `GitHub Search could not complete (HTTP ${res.status}). Try fewer results or add a token for higher limits.` };
    }
    let json: unknown;
    try {
      json = JSON.parse(text) as unknown;
    } catch {
      return { ok: false, error: "GitHub returned non-JSON" };
    }
    const root = asRecord(json);
    const itemsRaw = root && Array.isArray(root.items) ? root.items : [];
    return { ok: true, items: itemsRaw as GitHubIssueItem[] };
  } catch (e) {
    const msg = e instanceof Error && e.name === "AbortError" ? "GitHub request timed out" : e instanceof Error ? e.message : "GitHub fetch failed";
    return { ok: false, error: msg };
  } finally {
    clearTimeout(t);
  }
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
    const biasedQuery = buildGitHubOpportunitySearchQuery(args.query);
    const r = await fetchGitHubSearchIssues({ ...args, query: biasedQuery, token });
    if (!r.ok) return r;
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
