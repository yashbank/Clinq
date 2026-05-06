import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { LeadsPageView, PlatformFilter, ScoreBandFilter } from "@/lib/leads/leads-url-params";
import type { LeadSourceFilter } from "@/lib/leads/source-filters";
import type { LeadRow, PipelineStage } from "@/types/database";

export type { LeadsPageView, PlatformFilter, ScoreBandFilter } from "@/lib/leads/leads-url-params";

export type LeadsQueryParams = {
  page: number;
  pageSize?: number;
  q?: string;
  source?: LeadSourceFilter;
  platform?: PlatformFilter;
  scoreBand?: ScoreBandFilter;
  stage?: PipelineStage | "all";
  view?: LeadsPageView;
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

/** Higher = better match for ordering with primary sort key. */
function searchRankBonus(row: LeadRow, q: string): number {
  const qq = q.trim().toLowerCase();
  if (!qq) return 0;
  const name = row.client_name.toLowerCase();
  const meta =
    row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata) ? (row.metadata as Record<string, unknown>) : {};
  const title = typeof meta.project_title === "string" ? meta.project_title.toLowerCase() : "";
  let s = 0;
  if (name === qq) s += 40;
  else if (name.includes(qq)) s += 25;
  if (title === qq) s += 35;
  else if (title.includes(qq)) s += 18;
  const desc = (row.project_description ?? "").toLowerCase();
  if (desc.includes(qq)) s += 10;
  const metaStr = JSON.stringify(meta).toLowerCase();
  if (metaStr.includes(qq)) s += 5;
  return s;
}

function combinedListSort(a: LeadRow, b: LeadRow, q: string): number {
  const sink = (r: LeadRow) => (r.interest_status === "not_interested" ? -8000 : 0);
  const ka = sortKey(a) + searchRankBonus(a, q) * 5000 + sink(a);
  const kb = sortKey(b) + searchRankBonus(b, q) * 5000 + sink(b);
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

  query = query.order("sort_key", { ascending: false }).order("updated_at", { ascending: false });

  const { data: rawRows, error, count } = await query.range(offset, offset + pageSize - 1);
  if (error) {
    throw new Error(error.message);
  }
  const rows = [...((rawRows ?? []) as LeadRow[])].sort((a, b) => combinedListSort(a, b, q));
  return { rows, total: count ?? 0 };
}
