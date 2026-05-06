import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { canonicalLeadProjectTitle } from "@/lib/leads/canonical-lead-display";
import type { LeadRow } from "@/types/database";

const MS_DAY = 86_400_000;
const STOP = new Set([
  "the",
  "and",
  "for",
  "with",
  "from",
  "your",
  "you",
  "are",
  "our",
  "this",
  "that",
  "need",
  "looking",
  "want",
  "hire",
  "work",
  "project",
  "using",
  "based",
  "build",
  "app",
  "web",
  "developer",
  "development",
]);

function tokenizeTitle(title: string): string[] {
  const t = title
    .toLowerCase()
    .replace(/[^a-z0-9+#\s]/g, " ")
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length >= 3 && !STOP.has(w));
  return t;
}

function topRepeatedTokens(titles: string[], max = 10): string[] {
  const freq = new Map<string, number>();
  for (const title of titles) {
    const seen = new Set<string>();
    for (const tok of tokenizeTitle(title)) {
      if (seen.has(tok)) continue;
      seen.add(tok);
      freq.set(tok, (freq.get(tok) ?? 0) + 1);
    }
  }
  return [...freq.entries()]
    .filter(([, n]) => n >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, max)
    .map(([w]) => w);
}

function importProviderFromLead(row: Pick<LeadRow, "metadata">): string | null {
  const meta = row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata) ? (row.metadata as Record<string, unknown>) : {};
  const imp = meta.import && typeof meta.import === "object" && !Array.isArray(meta.import) ? (meta.import as Record<string, unknown>) : {};
  const prov = typeof imp.provider === "string" && imp.provider.trim() ? imp.provider.trim().toLowerCase() : null;
  if (prov) return prov;
  const ext = typeof meta.import_external_id === "string" ? meta.import_external_id : "";
  if (ext.includes(":")) return ext.split(":")[0]?.toLowerCase() ?? null;
  return null;
}

export type FeedbackSignalsSummary = {
  sinceIso: string;
  /** Tokens appearing in ≥2 interested lead titles (canonical). */
  interestedTitleTokens: string[];
  /** Import providers where scraped dismiss volume is heavy vs promoted (noise signal). */
  dismissHeavyImportSources: Set<string>;
  /** Import providers with share of imported leads that have ≥1 proposal (0–1). */
  proposalAttachRateByProvider: Record<string, number>;
  /** lead_id → count of open follow-up reminder activities. */
  openFollowUpsByLeadId: Map<string, number>;
};

function isOpenFollowUpMeta(meta: Record<string, unknown>): boolean {
  const st = typeof meta.status === "string" ? meta.status.toLowerCase() : "";
  return st !== "done";
}

/**
 * Deterministic aggregates from leads, proposals, activities, and scraped dismissals.
 */
export async function loadFeedbackSignalsSummary(supabase: SupabaseClient, userId: string): Promise<FeedbackSignalsSummary> {
  const since = new Date(Date.now() - 30 * MS_DAY).toISOString();

  const [
    { data: interestedLeads },
    { data: proposals },
    { data: followActs },
    { data: importedLeads },
    { data: dismissedScraped },
    { data: promotedScraped },
  ] = await Promise.all([
    supabase
      .from("leads")
      .select("id, metadata, client_name, project_description, short_description, platform, stage, score, interest_status")
      .eq("user_id", userId)
      .eq("interest_status", "interested")
      .is("deleted_at", null)
      .is("archived_at", null)
      .limit(120),
    supabase.from("proposals").select("lead_id, created_at").eq("user_id", userId).not("lead_id", "is", null).gte("created_at", since).limit(2000),
    supabase
      .from("activities")
      .select("lead_id, metadata, type")
      .eq("user_id", userId)
      .eq("type", "follow_up_reminder")
      .not("lead_id", "is", null)
      .limit(800),
    supabase
      .from("leads")
      .select("id, metadata")
      .eq("user_id", userId)
      .eq("is_imported_lead", true)
      .is("deleted_at", null)
      .is("archived_at", null)
      .limit(400),
    supabase
      .from("scraped_leads")
      .select("source, dismissed_at, skip_reason")
      .eq("user_id", userId)
      .gte("created_at", since)
      .not("dismissed_at", "is", null)
      .limit(2000),
    supabase
      .from("scraped_leads")
      .select("source, skip_reason")
      .eq("user_id", userId)
      .gte("created_at", since)
      .limit(2000),
  ]);

  const interestedTitles = (interestedLeads ?? []).map((r) => canonicalLeadProjectTitle(r as LeadRow));
  const interestedTitleTokens = topRepeatedTokens(interestedTitles, 12);

  const dismissBySource: Record<string, number> = {};
  for (const r of dismissedScraped ?? []) {
    const src = typeof r.source === "string" ? r.source.trim().toLowerCase() : "";
    if (!src) continue;
    dismissBySource[src] = (dismissBySource[src] ?? 0) + 1;
  }
  const promotedBySource: Record<string, number> = {};
  for (const r of promotedScraped ?? []) {
    const sr = typeof r.skip_reason === "string" ? r.skip_reason.toLowerCase() : "";
    if (!sr.includes("promoted")) continue;
    const src = typeof r.source === "string" ? r.source.trim().toLowerCase() : "";
    if (!src) continue;
    promotedBySource[src] = (promotedBySource[src] ?? 0) + 1;
  }
  const dismissHeavyImportSources = new Set<string>();
  for (const src of Object.keys(dismissBySource)) {
    const d = dismissBySource[src] ?? 0;
    const p = promotedBySource[src] ?? 0;
    if (d >= 4 && d > p * 1.5) dismissHeavyImportSources.add(src);
  }

  const proposalLeadIds = new Set<string>();
  for (const pr of proposals ?? []) {
    const id = typeof pr.lead_id === "string" ? pr.lead_id : null;
    if (id) proposalLeadIds.add(id);
  }

  const imported = (importedLeads ?? []) as Pick<LeadRow, "id" | "metadata">[];
  const byProv: Record<string, { total: number; withProposal: number }> = {};
  for (const row of imported) {
    const prov = importProviderFromLead(row) ?? "unknown";
    if (!byProv[prov]) byProv[prov] = { total: 0, withProposal: 0 };
    byProv[prov].total += 1;
    if (proposalLeadIds.has(row.id)) byProv[prov].withProposal += 1;
  }
  const proposalAttachRateByProvider: Record<string, number> = {};
  for (const [prov, v] of Object.entries(byProv)) {
    if (v.total <= 0) continue;
    proposalAttachRateByProvider[prov] = v.withProposal / v.total;
  }

  const openFollowUpsByLeadId = new Map<string, number>();
  for (const a of followActs ?? []) {
    const lid = typeof a.lead_id === "string" ? a.lead_id : null;
    if (!lid) continue;
    const meta = a.metadata && typeof a.metadata === "object" && !Array.isArray(a.metadata) ? (a.metadata as Record<string, unknown>) : {};
    if (!isOpenFollowUpMeta(meta)) continue;
    openFollowUpsByLeadId.set(lid, (openFollowUpsByLeadId.get(lid) ?? 0) + 1);
  }

  return {
    sinceIso: since,
    interestedTitleTokens,
    dismissHeavyImportSources,
    proposalAttachRateByProvider,
    openFollowUpsByLeadId,
  };
}

export function feedbackPriorityDelta(lead: LeadRow, sig: FeedbackSignalsSummary): number {
  let d = 0;
  const meta = lead.metadata && typeof lead.metadata === "object" && !Array.isArray(lead.metadata) ? (lead.metadata as Record<string, unknown>) : {};
  if (meta.clinq_promotion_source === "manual_scrape_review") {
    d += 9;
  }
  const prov = importProviderFromLead(lead);
  if (prov && sig.dismissHeavyImportSources.has(prov)) {
    d -= 4;
  }
  if (prov && (sig.proposalAttachRateByProvider[prov] ?? 0) >= 0.35 && lead.is_imported_lead) {
    d += 2;
  }
  const title = canonicalLeadProjectTitle(lead).toLowerCase();
  for (const tok of sig.interestedTitleTokens) {
    if (tok.length >= 4 && title.includes(tok)) {
      d += 2;
      break;
    }
  }
  const hours = Math.max(0, (Date.now() - new Date(lead.updated_at).getTime()) / 3_600_000);
  const score = Number(lead.score) || 0;
  if (score < 44 && hours > 720) {
    d -= 5;
  }
  return Math.max(-14, Math.min(16, d));
}
