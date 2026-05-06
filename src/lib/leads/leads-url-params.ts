import type { LeadSourceFilter } from "@/lib/leads/source-filters";
import type { PipelineStage } from "@/types/database";

export type LeadsPageView = "main" | "archived" | "high_potential";
export type PlatformFilter = "all" | "freelancer" | "manual";
export type ScoreBandFilter = "all" | "low" | "mid" | "high";

const SOURCE_SET = new Set<LeadSourceFilter>(["all", "imported", "manual", "freelancer"]);
const VIEW_SET = new Set<LeadsPageView>(["main", "archived", "high_potential"]);
const PLATFORM_SET = new Set<PlatformFilter>(["all", "freelancer", "manual"]);
const SCORE_SET = new Set<ScoreBandFilter>(["all", "low", "mid", "high"]);
const STAGES: PipelineStage[] = ["saved", "applied", "replied", "interview", "active", "completed"];

export type ParsedLeadsSearchParams = {
  page: number;
  q: string;
  source: LeadSourceFilter;
  view: LeadsPageView;
  platform: PlatformFilter;
  scoreBand: ScoreBandFilter;
  stage: PipelineStage | "all";
};

function pick<T extends string>(raw: string | undefined, allowed: Set<T>, fallback: T): T {
  const v = (raw ?? "").trim() as T;
  return allowed.has(v) ? v : fallback;
}

export function parseLeadsSearchParams(sp: Record<string, string | string[] | undefined>): ParsedLeadsSearchParams {
  const g = (k: string) => {
    const v = sp[k];
    return Array.isArray(v) ? v[0] : v;
  };
  const pageRaw = Number(g("page"));
  const page = Number.isFinite(pageRaw) && pageRaw >= 1 ? Math.floor(pageRaw) : 1;
  const q = String(g("q") ?? "").trim();
  const source = pick(g("source"), SOURCE_SET, "all");
  const view = pick(g("view"), VIEW_SET, "main");
  const platform = pick(g("platform"), PLATFORM_SET, "all");
  const scoreBand = pick(g("score"), SCORE_SET, "all");
  const stageRaw = (g("stage") ?? "all").trim();
  const stage = STAGES.includes(stageRaw as PipelineStage) ? (stageRaw as PipelineStage) : "all";
  return { page, q, source, view, platform, scoreBand, stage };
}

export function serializeLeadsParams(params: ParsedLeadsSearchParams): string {
  const p = new URLSearchParams();
  if (params.q) p.set("q", params.q);
  if (params.page > 1) p.set("page", String(params.page));
  if (params.source !== "all") p.set("source", params.source);
  if (params.view !== "main") p.set("view", params.view);
  if (params.platform !== "all") p.set("platform", params.platform);
  if (params.scoreBand !== "all") p.set("score", params.scoreBand);
  if (params.stage !== "all") p.set("stage", params.stage);
  return p.toString();
}

export function leadsPathFromParams(params: ParsedLeadsSearchParams): string {
  const s = serializeLeadsParams(params);
  return s ? `/leads?${s}` : "/leads";
}

/** Merge into an existing query string (e.g. from `useSearchParams().toString()`). */
export function mergeLeadsListHref(currentQs: string, patch: Partial<ParsedLeadsSearchParams>): string {
  const clean = currentQs.startsWith("?") ? currentQs.slice(1) : currentQs;
  const p = new URLSearchParams(clean);

  const setOrDel = (urlKey: string, val: string | number | undefined, allToken?: string) => {
    if (val === undefined) return;
    const sval = String(val);
    if (sval === "" || sval === allToken) p.delete(urlKey);
    else p.set(urlKey, sval);
  };

  if (patch.q !== undefined) setOrDel("q", patch.q);
  if (patch.page !== undefined) {
    if (patch.page <= 1) p.delete("page");
    else p.set("page", String(patch.page));
  }
  if (patch.source !== undefined) setOrDel("source", patch.source, "all");
  if (patch.view !== undefined) {
    if (patch.view === "main") p.delete("view");
    else p.set("view", patch.view);
  }
  if (patch.platform !== undefined) setOrDel("platform", patch.platform, "all");
  if (patch.scoreBand !== undefined) setOrDel("score", patch.scoreBand, "all");
  if (patch.stage !== undefined) setOrDel("stage", patch.stage, "all");

  const s = p.toString();
  return s ? `/leads?${s}` : "/leads";
}
