import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { computeLeadPriorityScore } from "@/lib/ai/lead-priority";
import { mergeUsdToForeignRates } from "@/lib/currency/display-currency";
import { getUsdToForeignRates } from "@/lib/currency/exchange-rates";
import { resolveEffectiveBudgetUsd } from "@/lib/leads/effective-budget-usd";
import { computeLeadFreelancerMatch } from "@/lib/leads/lead-freelancer-match";
import { loadFeedbackSignalsSummary, type FeedbackSignalsSummary } from "@/lib/opportunity/feedback-signals";
import type { LeadsPageView, LeadsSortMode, PlatformFilter, ScoreBandFilter } from "@/lib/leads/leads-url-params";
import type { LeadSourceFilter } from "@/lib/leads/source-filters";
import type { LeadRow, PipelineStage } from "@/types/database";

export type { LeadsPageView, LeadsSortMode, PlatformFilter, ScoreBandFilter } from "@/lib/leads/leads-url-params";

/** Max rows loaded for “Recommended” sort before in-memory priority ordering (server-only). */
export const RECOMMENDED_SORT_CAP = 800;

/** Max rows loaded for text search before relevance ordering (server-only). */
export const SEARCH_RELEVANCE_CAP = 400;

export type LeadsQueryParams = {
  page: number;
  pageSize?: number;
  q?: string;
  source?: LeadSourceFilter;
  platform?: PlatformFilter;
  scoreBand?: ScoreBandFilter;
  stage?: PipelineStage | "all";
  view?: LeadsPageView;
  sort?: LeadsSortMode;
  /** Profile tokens used to rank search hits (skill match > title > description). */
  profileSearchTokens?: string[];
  /** When set, recommended sort uses overlap + niche + effective USD (V3). */
  freelancerProfile?: { skills: string[]; tech_stack: string[]; niches: string[] };
};

export type LeadTabCounts = {
  all: number;
  imported: number;
  manual: number;
  freelancer: number;
};

function escapeIlike(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

function sortKey(row: LeadRow): number {
  const r = row as LeadRow & { sort_key?: number | null };
  return typeof r.sort_key === "number" && Number.isFinite(r.sort_key) ? r.sort_key : row.score;
}

/**
 * Search ranking: skill/profile token overlap > title/query match > description match.
 * Returns a secondary sort score (larger = better match to query + profile).
 */
function searchRankBonus(row: LeadRow, q: string, profileTokens: string[]): number {
  const qq = q.trim().toLowerCase();
  const meta =
    row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata) ? (row.metadata as Record<string, unknown>) : {};
  const title = typeof meta.project_title === "string" ? meta.project_title.toLowerCase() : "";
  const name = row.client_name.toLowerCase();
  const desc = (row.project_description ?? "").toLowerCase();
  const hay = `${title} ${name} ${desc}`.toLowerCase();

  let skill = 0;
  for (const tok of profileTokens) {
    const t = tok.toLowerCase().trim();
    if (t.length < 2) continue;
    if (hay.includes(t)) skill += 1;
  }
  skill = Math.min(24, skill * 4);

  let titlePart = 0;
  let descPart = 0;
  if (qq) {
    if (title === qq || name === qq) titlePart += 50;
    else if (title.includes(qq) || name.includes(qq)) titlePart += 32;
    else if (title.length > 0 && qq.split(/\s+/).some((w) => w.length > 1 && title.includes(w))) titlePart += 18;

    if (desc.includes(qq)) descPart += 14;
    else if (qq.split(/\s+/).some((w) => w.length > 2 && desc.includes(w))) descPart += 8;
  }

  return skill * 1000 + titlePart * 40 + descPart;
}

function combinedListSort(a: LeadRow, b: LeadRow, q: string, profileTokens: string[]): number {
  const sink = (r: LeadRow) => (r.interest_status === "not_interested" ? -8000 : 0);
  const ka = sortKey(a) + searchRankBonus(a, q, profileTokens) * 50 + sink(a);
  const kb = sortKey(b) + searchRankBonus(b, q, profileTokens) * 50 + sink(b);
  if (kb !== ka) return kb - ka;
  return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
}

/**
 * Relevance score for active search: profile/skill overlap in title (highest), then title/query,
 * then description; unrelated rows are heavily penalized.
 */
function searchRelevanceScore(row: LeadRow, q: string, profileTokens: string[]): number {
  const qq = q.trim().toLowerCase();
  if (!qq) return 0;

  const meta =
    row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata) ? (row.metadata as Record<string, unknown>) : {};
  const title = typeof meta.project_title === "string" ? meta.project_title.toLowerCase() : "";
  const name = row.client_name.toLowerCase();
  const desc = (row.project_description ?? "").toLowerCase();

  let skillInTitle = 0;
  let skillInDesc = 0;
  for (const tok of profileTokens) {
    const t = tok.toLowerCase().trim();
    if (t.length < 2) continue;
    if (title.includes(t) || name.includes(t)) skillInTitle += 200;
    else if (desc.includes(t)) skillInDesc += 72;
  }
  const skillScore = Math.min(5200, skillInTitle + skillInDesc);

  const words = [...new Set(qq.split(/\s+/).filter((w) => w.length > 1))];
  let titleHits = 0;
  let nameHits = 0;
  let descHits = 0;
  for (const w of words) {
    if (title.includes(w)) titleHits += 260;
    if (name.includes(w)) nameHits += 110;
    if (desc.includes(w)) descHits += 48;
  }
  if (qq.length >= 3) {
    if (title.includes(qq) || name.includes(qq)) titleHits += 420;
    if (desc.includes(qq)) descHits += 140;
  }

  let raw = skillScore * 2.4 + titleHits + nameHits * 0.9 + descHits * 0.5;

  if (words.length > 0) {
    const anyWordHit = words.some((w) => title.includes(w) || name.includes(w) || desc.includes(w));
    if (!anyWordHit) raw -= 72_000;
  }

  const sink = row.interest_status === "not_interested" ? -14_000 : 0;
  return raw + sink + sortKey(row) * 0.06;
}

function buildFilteredLeadsQuery(supabase: SupabaseClient, params: LeadsQueryParams) {
  const view = params.view ?? "main";
  let query = supabase.from("leads").select("*", { count: "exact" });

  if (view === "archived") {
    query = query.not("archived_at", "is", null).is("deleted_at", null);
  } else {
    query = query.is("archived_at", null).is("deleted_at", null);
    if (view === "high_potential") {
      query = query.gte("score", 80);
    }
  }

  const source = params.source ?? "all";
  if (source === "imported") query = query.eq("is_imported_lead", true);
  else if (source === "manual") query = query.eq("is_imported_lead", false);
  else if (source === "freelancer") query = query.eq("is_freelancer_channel", true);

  const platform = params.platform ?? "all";
  if (platform === "freelancer") query = query.eq("is_freelancer_channel", true);
  else if (platform === "manual") query = query.eq("is_freelancer_channel", false);

  const scoreBand = params.scoreBand ?? "all";
  if (scoreBand === "low") query = query.lte("score", 50);
  else if (scoreBand === "mid") query = query.gte("score", 51).lte("score", 79);
  else if (scoreBand === "high") query = query.gte("score", 80);

  const stage = params.stage ?? "all";
  if (stage !== "all") query = query.eq("stage", stage);

  const q = (params.q ?? "").trim();
  if (q) {
    const like = `%${escapeIlike(q)}%`;
    query = query.or(
      `client_name.ilike.${like},company.ilike.${like},project_description.ilike.${like},metadata->>project_title.ilike.${like}`,
    );
  }

  return query;
}

export type LeadsListSummary = {
  activeCount: number;
  highScore80Plus: number;
  repeatCount: number;
  totalBudget: number;
  avgScore: number;
};

export async function fetchLeadsListSummary(supabase: SupabaseClient): Promise<LeadsListSummary> {
  const { data, error } = await supabase
    .from("leads")
    .select("score, budget, budget_usd, budget_avg, budget_min, budget_max, currency_original, metadata, repeat_hire")
    .is("deleted_at", null)
    .is("archived_at", null);
  if (error) {
    throw new Error(error.message);
  }
  let usdToForeignRates: Record<string, number> | null = null;
  try {
    usdToForeignRates = await getUsdToForeignRates();
  } catch {
    usdToForeignRates = null;
  }
  const list = (data ?? []) as LeadRow[];
  const activeCount = list.length;
  const highScore80Plus = list.filter((r) => r.score >= 80).length;
  const repeatCount = list.filter((r) => r.repeat_hire).length;
  const mergedFx = mergeUsdToForeignRates(usdToForeignRates);
  const totalBudget = list.reduce((s, r) => s + (resolveEffectiveBudgetUsd(r, mergedFx) ?? 0), 0);
  const avgScore = activeCount ? list.reduce((s, r) => s + r.score, 0) / activeCount : 0;
  return { activeCount, highScore80Plus, repeatCount, totalBudget, avgScore };
}

export async function fetchLeadTabCounts(supabase: SupabaseClient): Promise<LeadTabCounts> {
  const { data, error } = await supabase.rpc("lead_tab_counts");
  if (error || !data || !Array.isArray(data) || data.length === 0) {
    return { all: 0, imported: 0, manual: 0, freelancer: 0 };
  }
  const row = data[0] as { all_main?: number; imported?: number; manual_n?: number; freelancer_n?: number };
  return {
    all: Number(row.all_main ?? 0),
    imported: Number(row.imported ?? 0),
    manual: Number(row.manual_n ?? 0),
    freelancer: Number(row.freelancer_n ?? 0),
  };
}

export async function fetchLeadsPage(
  supabase: SupabaseClient,
  params: LeadsQueryParams,
): Promise<{ rows: LeadRow[]; total: number }> {
  const pageSize = Math.min(50, Math.max(1, params.pageSize ?? 20));
  const page = Math.max(1, params.page ?? 1);
  const offset = (page - 1) * pageSize;
  const q = (params.q ?? "").trim();
  const sort = params.sort ?? "default";
  const profileSearchTokens = (params.profileSearchTokens ?? [])
    .map((s) => s.trim())
    .filter((s) => s.length > 1)
    .slice(0, 80);

  let query = buildFilteredLeadsQuery(supabase, params);

  if (sort === "recommended") {
    let feedbackSummary: FeedbackSignalsSummary | null = null;
    const { data: auth } = await supabase.auth.getUser();
    if (auth.user) {
      feedbackSummary = await loadFeedbackSignalsSummary(supabase, auth.user.id);
    }

    let mergedFx: Record<string, number> = {};
    try {
      mergedFx = mergeUsdToForeignRates(await getUsdToForeignRates());
    } catch {
      mergedFx = {};
    }

    const proposalLeadSet = new Set<string>();
    if (auth.user) {
      const { data: propRows } = await supabase
        .from("proposals")
        .select("lead_id")
        .eq("user_id", auth.user.id)
        .not("lead_id", "is", null)
        .limit(4000);
      for (const pr of propRows ?? []) {
        const id = typeof pr.lead_id === "string" ? pr.lead_id : null;
        if (id) proposalLeadSet.add(id);
      }
    }

    const fp = params.freelancerProfile;
    const tokenBase = [
      ...(fp?.skills ?? []),
      ...(fp?.tech_stack ?? []),
      ...(fp?.niches ?? []),
      ...profileSearchTokens,
    ]
      .map((s) => s.trim().toLowerCase())
      .filter((s) => s.length > 1);
    const rankingTokens = [...new Set(tokenBase)].slice(0, 80);

    const prio = (row: LeadRow) => {
      let skillMatchPct: number | undefined;
      let nicheMatchPct: number | undefined;
      if (fp) {
        const m = computeLeadFreelancerMatch(row, { skills: fp.skills, techStack: fp.tech_stack, niches: fp.niches });
        skillMatchPct = m.skillMatchPct;
        nicheMatchPct = m.nicheMatchPct;
      }
      const effectiveUsd = Object.keys(mergedFx).length > 0 ? resolveEffectiveBudgetUsd(row, mergedFx) : resolveEffectiveBudgetUsd(row, null);
      return computeLeadPriorityScore(row, {
        feedbackSummary: feedbackSummary ?? undefined,
        openFollowUpCount: feedbackSummary?.openFollowUpsByLeadId.get(row.id) ?? 0,
        skillMatchPct,
        nicheMatchPct,
        effectiveBudgetUsd: effectiveUsd,
        profileTokens: rankingTokens.length > 0 ? rankingTokens : undefined,
        hasProposal: proposalLeadSet.has(row.id),
      });
    };

    query = query.order("updated_at", { ascending: false });
    const { data: poolRows, error, count } = await query.range(0, RECOMMENDED_SORT_CAP - 1);
    if (error) {
      throw new Error(error.message);
    }
    const pool = (poolRows ?? []) as LeadRow[];
    const fullCount = count ?? pool.length;
    const cappedTotal = Math.min(fullCount, RECOMMENDED_SORT_CAP);
    const sorted = [...pool].sort((a, b) => {
      const pa =
        prio(a) * (q ? 0.82 : 1) +
        (q ? searchRelevanceScore(a, q, profileSearchTokens) * 0.22 : searchRankBonus(a, q, profileSearchTokens) * 0.02);
      const pb =
        prio(b) * (q ? 0.82 : 1) +
        (q ? searchRelevanceScore(b, q, profileSearchTokens) * 0.22 : searchRankBonus(b, q, profileSearchTokens) * 0.02);
      if (pb !== pa) return pb - pa;
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });
    const rows = sorted.slice(offset, offset + pageSize);
    return { rows, total: cappedTotal };
  }

  if (q) {
    const sq = buildFilteredLeadsQuery(supabase, params).order("updated_at", { ascending: false });
    const { data: poolRows, error, count } = await sq.range(0, SEARCH_RELEVANCE_CAP - 1);
    if (error) {
      throw new Error(error.message);
    }
    const pool = (poolRows ?? []) as LeadRow[];
    const fullCount = count ?? pool.length;
    const cappedTotal = Math.min(fullCount, SEARCH_RELEVANCE_CAP);
    const sorted = [...pool].sort((a, b) => {
      const ra = searchRelevanceScore(a, q, profileSearchTokens);
      const rb = searchRelevanceScore(b, q, profileSearchTokens);
      if (rb !== ra) return rb - ra;
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });
    const rows = sorted.slice(offset, offset + pageSize);
    return { rows, total: cappedTotal };
  }

  query = buildFilteredLeadsQuery(supabase, params)
    .order("sort_key", { ascending: false })
    .order("updated_at", { ascending: false });

  const { data: rawRows, error, count } = await query.range(offset, offset + pageSize - 1);
  if (error) {
    throw new Error(error.message);
  }
  const rows = [...((rawRows ?? []) as LeadRow[])].sort((a, b) => combinedListSort(a, b, q, profileSearchTokens));
  return { rows, total: count ?? 0 };
}
