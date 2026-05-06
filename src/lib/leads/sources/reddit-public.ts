import "server-only";

import type { CreateLeadInput } from "@/lib/leads/create-lead-input";
import type { NormalizedScrapeRow, PublicLeadSourceAdapter } from "@/lib/leads/sources/types";

const UA = "Clinq/1.0 (https://github.com/yashbank/Clinq; lead discovery; respects robots)";

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

function str(v: unknown, max = 8000): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  if (!t) return null;
  return t.length > max ? t.slice(0, max) : t;
}

export type RedditListingData = Record<string, unknown>;

export async function fetchRedditSearchJson(args: {
  query: string;
  limit: number;
}): Promise<{ ok: true; items: RedditListingData[] } | { ok: false; error: string }> {
  const q = args.query.trim();
  if (!q) {
    return { ok: false, error: "Search query is required" };
  }
  const limit = Math.min(25, Math.max(1, args.limit));
  const url = new URL("https://www.reddit.com/search.json");
  url.searchParams.set("q", q);
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("sort", "relevance");
  url.searchParams.set("type", "link");
  url.searchParams.set("restrict_sr", "false");

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 20_000);
  try {
    const res = await fetch(url.toString(), {
      headers: { "User-Agent": UA, Accept: "application/json" },
      signal: controller.signal,
    });
    const text = await res.text();
    if (!res.ok) {
      return { ok: false, error: `Reddit returned HTTP ${res.status}` };
    }
    let json: unknown;
    try {
      json = JSON.parse(text) as unknown;
    } catch {
      return { ok: false, error: "Reddit returned non-JSON" };
    }
    const root = asRecord(json);
    const data = root ? asRecord(root.data) : null;
    const children = data && Array.isArray(data.children) ? data.children : [];
    const items: RedditListingData[] = [];
    for (const ch of children) {
      const cr = asRecord(ch);
      const d = cr && cr.kind === "t3" ? asRecord(cr.data) : asRecord(ch);
      if (d && typeof d.id === "string") items.push(d);
    }
    return { ok: true, items };
  } catch (e) {
    const msg = e instanceof Error && e.name === "AbortError" ? "Reddit request timed out" : e instanceof Error ? e.message : "Reddit fetch failed";
    return { ok: false, error: msg };
  } finally {
    clearTimeout(t);
  }
}

export function normalizeRedditListing(data: RedditListingData, importedAtIso: string): NormalizedScrapeRow | null {
  const id = str(data.id, 32);
  if (!id) return null;
  const title = str(data.title, 500) ?? "Untitled post";
  const selftext = str(data.selftext, 12000) ?? "";
  const permalink = str(data.permalink, 500);
  const author = str(data.author, 120) ?? "reddit";
  const subreddit = str(data.subreddit, 120) ?? "";
  const url = permalink ? `https://www.reddit.com${permalink}` : str(data.url, 2000) ?? `https://www.reddit.com/comments/${id.replace(/^t3_/, "")}/`;

  const descParts = [selftext.length > 0 ? selftext : null, subreddit ? `r/${subreddit}` : null].filter(Boolean);
  const project_description = descParts.join("\n\n").slice(0, 12000) || title;

  const input: CreateLeadInput = {
    client_name: author === "[deleted]" ? "Reddit" : author.slice(0, 120),
    project_title: title.slice(0, 500),
    project_url: url,
    source: "reddit",
    platform: "Reddit",
    project_description,
    repeat_hire: false,
    competition_level: 3,
    project_quality: selftext.length > 120 ? 4 : 2,
    proposal_match_notes: subreddit ? `Subreddit: r/${subreddit}` : undefined,
  };

  const importExternalId = `reddit:${id}`;

  const metadataExtra: Record<string, unknown> = {
    import_external_id: importExternalId,
    import: {
      provider: "reddit",
      external_id: id,
      imported_at: importedAtIso,
      url,
      tags: [subreddit ? `r/${subreddit}` : "", "reddit"].filter(Boolean),
      raw_snapshot: {
        id,
        subreddit,
        permalink,
        created_utc: data.created_utc,
      },
    },
  };

  return { input, metadataExtra };
}

export function redditDedupeKeyFromListing(data: RedditListingData): string | null {
  const id = str(data.id, 32);
  return id ? `reddit:${id}` : null;
}

export const redditPublicAdapter: PublicLeadSourceAdapter = {
  id: "reddit",
  label: "Reddit (public search)",
  async fetchRaw(args) {
    const r = await fetchRedditSearchJson(args);
    if (!r.ok) return r;
    return { ok: true, items: r.items as unknown[] };
  },
  normalize(raw, importedAtIso) {
    const d = asRecord(raw);
    if (!d) return null;
    return normalizeRedditListing(d as RedditListingData, importedAtIso);
  },
  dedupeKeyFromRaw(raw) {
    const d = asRecord(raw);
    if (!d) return null;
    return redditDedupeKeyFromListing(d as RedditListingData);
  },
};
