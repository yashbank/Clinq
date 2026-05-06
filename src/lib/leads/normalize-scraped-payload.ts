import "server-only";

import { normalizeFreelancerProject } from "@/lib/leads/ingest/freelancer-normalize";
import { normalizeGitHubIssue, type GitHubIssueItem } from "@/lib/leads/sources/github-public";
import { normalizeRedditListing, type RedditListingData } from "@/lib/leads/sources/reddit-public";
import type { NormalizedScrapeRow } from "@/lib/leads/sources/types";

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

/** Normalize `scraped_leads.raw_data` for a known `source` (never writes to `leads`). */
export function normalizeScrapedPayload(
  source: string,
  raw: Record<string, unknown>,
  importedAt: string,
): NormalizedScrapeRow | null {
  if (source === "freelancer") {
    const fp = raw.freelancer_project;
    if (fp == null) return null;
    return normalizeFreelancerProject(fp, importedAt) as NormalizedScrapeRow;
  }
  if (source === "reddit") {
    const listing = raw.reddit_listing;
    const rec = asRecord(listing);
    if (!rec) return null;
    return normalizeRedditListing(rec as RedditListingData, importedAt);
  }
  if (source === "github") {
    const issue = raw.github_issue;
    const rec = asRecord(issue);
    if (!rec) return null;
    return normalizeGitHubIssue(rec as GitHubIssueItem, importedAt);
  }
  return null;
}

export function rawTitleHint(source: string, raw: Record<string, unknown>): string {
  if (source === "freelancer") {
    const fp = raw.freelancer_project;
    const r = asRecord(fp);
    return r ? String(r.title ?? "").slice(0, 200) : "";
  }
  if (source === "reddit") {
    const r = asRecord(raw.reddit_listing);
    return r ? String(r.title ?? "").slice(0, 200) : "";
  }
  if (source === "github") {
    const r = asRecord(raw.github_issue);
    return r ? String(r.title ?? "").slice(0, 200) : "";
  }
  return "";
}
