import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { computeLeadPriorityScore } from "@/lib/ai/lead-priority";
import type { LeadsPageView, LeadsSortMode, PlatformFilter, ScoreBandFilter } from "@/lib/leads/leads-url-params";
import type { LeadSourceFilter } from "@/lib/leads/source-filters";
import type { LeadRow, PipelineStage } from "@/types/database";

export type { LeadsPageView, LeadsSortMode, PlatformFilter, ScoreBandFilter } from "@/lib/leads/leads-url-params";

/** Max rows loaded for “Recommended” sort before in-memory priority ordering (server-only). */
export const RECOMMENDED_SORT_CAP = 800;

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
    .select("score, budget, repeat_hire")
    .is("deleted_at", null)
    .is("archived_at", null);
  if (error) {
    throw new Error(error.message);
  }
  const list = data ?? [];
  const activeCount = list.length;
  const highScore80Plus = list.filter((r) => (r as { score: number }).score >= 80).length;
  const repeatCount = list.filter((r) => (r as { repeat_hire?: boolean }).repeat_hire).length;
  const totalBudget = list.reduce((s, r) => s + (Number((r as { budget?: number | null }).budget) || 0), 0);
  const avgScore = activeCount ? list.reduce((s, r) => s + (r as { score: number }).score, 0) / activeCount : 0;
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
  const view = params.view ?? "main";
  const q = (params.q ?? "").trim();
  const sort = params.sort ?? "default";
  const profileSearchTokens = (params.profileSearchTokens ?? [])
    .map((s) => s.trim())
    .filter((s) => s.length > 1)
    .slice(0, 80);

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

  if (q) {
    const like = `%${escapeIlike(q)}%`;
    query = query.or(
      `client_name.ilike.${like},company.ilike.${like},project_description.ilike.${like},metadata->>project_title.ilike.${like}`,
    );
  }

  if (sort === "recommended") {
    query = query.order("updated_at", { ascending: false });
    const { data: poolRows, error, count } = await query.range(0, RECOMMENDED_SORT_CAP - 1);
    if (error) {
      throw new Error(error.message);
    }
    const pool = (poolRows ?? []) as LeadRow[];
    const fullCount = count ?? pool.length;
    const cappedTotal = Math.min(fullCount, RECOMMENDED_SORT_CAP);
    const sorted = [...pool].sort((a, b) => {
      const pa = computeLeadPriorityScore(a) + searchRankBonus(a, q, profileSearchTokens) * 0.02;
      const pb = computeLeadPriorityScore(b) + searchRankBonus(b, q, profileSearchTokens) * 0.02;
      if (pb !== pa) return pb - pa;
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });
    const rows = sorted.slice(offset, offset + pageSize);
    return { rows, total: cappedTotal };
  }

  query = query.order("sort_key", { ascending: false }).order("updated_at", { ascending: false });

  const { data: rawRows, error, count } = await query.range(offset, offset + pageSize - 1);
  if (error) {
    throw new Error(error.message);
  }
  const rows = [...((rawRows ?? []) as LeadRow[])].sort((a, b) => combinedListSort(a, b, q, profileSearchTokens));
  return { rows, total: count ?? 0 };
}
