"use client";

import Link from "next/link";
import { Search, Target } from "lucide-react";

import { MobileAppNav } from "@/components/dashboard/mobile-app-nav";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { LeadSourceFilter } from "@/lib/leads/source-filters";
import { leadsPathFromParams, type ParsedLeadsSearchParams } from "@/lib/leads/leads-url-params";
import type { PipelineStage } from "@/types/database";

function formatUsd(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  if (n > 0) return `$${Math.round(n).toLocaleString()}`;
  return "$0";
}

const SCORE_OPTIONS: { value: ParsedLeadsSearchParams["scoreBand"]; label: string }[] = [
  { value: "all", label: "All scores" },
  { value: "low", label: "0–50" },
  { value: "mid", label: "51–79" },
  { value: "high", label: "80+" },
];

const PLATFORM_OPTIONS: { value: ParsedLeadsSearchParams["platform"]; label: string }[] = [
  { value: "all", label: "All platforms" },
  { value: "freelancer", label: "Freelancer" },
  { value: "manual", label: "Manual / other" },
];

const STAGE_OPTIONS: { value: PipelineStage | "all"; label: string }[] = [
  { value: "all", label: "All stages" },
  { value: "saved", label: "Saved" },
  { value: "applied", label: "Applied" },
  { value: "replied", label: "Replied" },
  { value: "interview", label: "Interview" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
];

const SORT_OPTIONS: { value: ParsedLeadsSearchParams["sort"]; label: string }[] = [
  { value: "default", label: "Sort: Default" },
  { value: "recommended", label: "Recommended" },
];

export function LeadIntelligenceHeader({
  onAddLead,
  leadCount = 0,
  highScoreCount = 0,
  repeatCount = 0,
  totalBudget = 0,
  avgScore = 0,
  sourceFilter = "all",
  sourceCounts,
  importSummaryLine,
  parsedQuery,
  onNavigate,
  total,
  totalPages,
  currentPage,
}: {
  onAddLead?: () => void;
  leadCount?: number;
  highScoreCount?: number;
  repeatCount?: number;
  totalBudget?: number;
  avgScore?: number;
  sourceFilter?: LeadSourceFilter;
  sourceCounts?: { all: number; imported: number; manual: number; freelancer: number };
  importSummaryLine?: string | null;
  parsedQuery: ParsedLeadsSearchParams;
  onNavigate: (patch: Partial<ParsedLeadsSearchParams>) => void;
  total: number;
  totalPages: number;
  currentPage: number;
}) {
  const avgScoreLabel = leadCount === 0 ? "—" : avgScore.toFixed(1);
  const base = { ...parsedQuery };

  return (
    <header className="shrink-0 border-b border-clinq-glass-border bg-background/90 backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <MobileAppNav />
          <div className="flex min-w-0 items-center gap-3">
            <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 sm:flex">
              <Target className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-semibold text-foreground sm:text-xl">Lead Intelligence</h1>
              <p className="truncate text-xs text-muted-foreground sm:text-sm">Scores and fields from your saved leads</p>
            </div>
          </div>
        </div>

        <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto sm:flex-nowrap">
          {onAddLead ? (
            <Button type="button" onClick={onAddLead} className="gap-2 bg-primary text-primary-foreground shadow-none hover:bg-primary/90">
              <Target className="h-4 w-4" />
              Add lead
            </Button>
          ) : null}

          <form action="/leads" method="get" className="relative min-w-0 flex-1 sm:max-w-xs sm:flex-initial">
            <input type="hidden" name="source" value={parsedQuery.source} />
            <input type="hidden" name="view" value={parsedQuery.view} />
            <input type="hidden" name="platform" value={parsedQuery.platform} />
            <input type="hidden" name="score" value={parsedQuery.scoreBand} />
            <input type="hidden" name="stage" value={parsedQuery.stage} />
            <input type="hidden" name="sort" value={parsedQuery.sort} />
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              name="q"
              defaultValue={parsedQuery.q}
              placeholder="Search leads…"
              className="clinq-input h-10 w-full min-w-0 rounded-lg border border-[var(--control-border)] bg-[var(--control-bg)] pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground sm:w-64"
            />
          </form>
        </div>
      </div>

      <div className="flex flex-col gap-2 border-t border-clinq-glass-border/50 px-4 py-2.5 sm:px-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">View</span>
          {(
            [
              ["main", "Active"],
              ["high_potential", "High potential"],
              ["archived", "Archived"],
            ] as const
          ).map(([view, label]) => (
            <Link
              key={view}
              href={leadsPathFromParams({ ...base, view, page: 1 })}
              className={cn(
                "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                parsedQuery.view === view
                  ? "bg-primary/15 text-primary ring-1 ring-primary/30"
                  : "bg-muted/40 text-muted-foreground hover:bg-muted/55 hover:text-foreground",
              )}
            >
              {label}
            </Link>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2 overflow-x-auto">
          {sourceCounts ? (
            <>
              {(
                [
                  ["all", "All", sourceCounts.all],
                  ["imported", "Imported", sourceCounts.imported],
                  ["manual", "Manual", sourceCounts.manual],
                  ["freelancer", "Freelancer", sourceCounts.freelancer],
                ] as const
              ).map(([key, label, n]) => (
                <Link
                  key={key}
                  href={leadsPathFromParams({ ...base, source: key, page: 1 })}
                  className={cn(
                    "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                    sourceFilter === key
                      ? "bg-primary/15 text-primary ring-1 ring-primary/30"
                      : "bg-muted/40 text-muted-foreground hover:bg-muted/55 hover:text-foreground",
                  )}
                >
                  {label} · {n}
                </Link>
              ))}
            </>
          ) : (
            <span className="shrink-0 rounded-full bg-muted/40 px-3 py-1.5 text-xs font-medium text-muted-foreground">
              All · {leadCount}
            </span>
          )}
          <span className="shrink-0 rounded-full bg-muted/40 px-3 py-1.5 text-xs font-medium text-muted-foreground">
            80+ · {highScoreCount}
          </span>
          <span className="shrink-0 rounded-full bg-muted/40 px-3 py-1.5 text-xs font-medium text-muted-foreground">
            Repeat · {repeatCount}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 gap-y-2 sm:gap-3">
          <select
            value={parsedQuery.platform}
            onChange={(e) => onNavigate({ platform: e.target.value as ParsedLeadsSearchParams["platform"], page: 1 })}
            className="h-9 min-w-[10rem] rounded-md border border-border bg-popover px-3 py-1.5 text-sm text-foreground shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          >
            {PLATFORM_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <select
            value={parsedQuery.scoreBand}
            onChange={(e) => onNavigate({ scoreBand: e.target.value as ParsedLeadsSearchParams["scoreBand"], page: 1 })}
            className="h-9 min-w-[9rem] rounded-md border border-border bg-popover px-3 py-1.5 text-sm text-foreground shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          >
            {SCORE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <select
            value={parsedQuery.stage}
            onChange={(e) =>
              onNavigate({ stage: e.target.value as ParsedLeadsSearchParams["stage"], page: 1 })
            }
            className="h-9 min-w-[9rem] rounded-md border border-border bg-popover px-3 py-1.5 text-sm text-foreground shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          >
            {STAGE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <select
            value={parsedQuery.sort}
            onChange={(e) => onNavigate({ sort: e.target.value as ParsedLeadsSearchParams["sort"], page: 1 })}
            className="h-9 min-w-[10rem] rounded-md border border-border bg-popover px-3 py-1.5 text-sm text-foreground shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {importSummaryLine ? (
          <p className="text-[11px] leading-snug text-muted-foreground">{importSummaryLine}</p>
        ) : null}

        {parsedQuery.sort === "recommended" ? (
          <p className="text-[11px] text-muted-foreground">
            Sorted by Clinq priority (up to 800 most recent rows loaded for ranking).
          </p>
        ) : null}

        {totalPages > 1 ? (
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-clinq-glass-border/40 pt-2">
            <p className="text-[11px] text-muted-foreground">
              Page <span className="font-medium text-foreground">{currentPage}</span> of{" "}
              <span className="font-medium text-foreground">{totalPages}</span>
              <span className="mx-1">·</span>
              {total} total
            </p>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => onNavigate({ page: currentPage - 1 })}>
                Previous
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => onNavigate({ page: currentPage + 1 })}
              >
                Next
              </Button>
            </div>
          </div>
        ) : null}
      </div>

      {leadCount > 0 ? (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-1 border-t border-clinq-glass-border/50 bg-sidebar/25 px-4 py-2 text-xs text-muted-foreground sm:px-6 sm:text-sm">
          <span>
            Pipeline budgets (sum): <span className="font-medium text-foreground">{formatUsd(totalBudget)}</span>
          </span>
          <span className="hidden h-3 w-px bg-clinq-glass-border sm:inline" />
          <span>
            Avg score: <span className="font-medium text-foreground">{avgScoreLabel}</span>
          </span>
        </div>
      ) : null}
    </header>
  );
}
