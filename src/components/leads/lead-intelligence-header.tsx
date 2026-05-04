"use client";

import { Search, Target } from "lucide-react";
import { useState } from "react";

import { MobileAppNav } from "@/components/dashboard/mobile-app-nav";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { LeadSourceFilter } from "@/lib/leads/source-filters";

function formatUsd(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  if (n > 0) return `$${Math.round(n).toLocaleString()}`;
  return "$0";
}

export function LeadIntelligenceHeader({
  onAddLead,
  leadCount = 0,
  highScoreCount = 0,
  repeatCount = 0,
  totalBudget = 0,
  avgScore = 0,
  listSearch = "",
  onListSearchChange,
  sourceFilter = "all",
  onSourceFilterChange,
  sourceCounts,
  importSummaryLine,
}: {
  onAddLead?: () => void;
  leadCount?: number;
  highScoreCount?: number;
  repeatCount?: number;
  totalBudget?: number;
  avgScore?: number;
  listSearch?: string;
  onListSearchChange?: (value: string) => void;
  sourceFilter?: LeadSourceFilter;
  onSourceFilterChange?: (value: LeadSourceFilter) => void;
  sourceCounts?: { all: number; imported: number; manual: number; freelancer: number };
  importSummaryLine?: string | null;
}) {
  const [localSearch, setLocalSearch] = useState("");
  const searchQuery = onListSearchChange ? listSearch : localSearch;
  const setSearchQuery = onListSearchChange ?? setLocalSearch;
  const avgScoreLabel = leadCount === 0 ? "—" : avgScore.toFixed(1);

  return (
    <header className="shrink-0 border-b border-clinq-glass-border bg-background/90 backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-3 px-3 py-3 sm:px-6 sm:py-4">
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

          <div className="relative min-w-0 flex-1 sm:max-w-xs sm:flex-initial">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search in this list…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="clinq-input h-10 w-full min-w-0 rounded-lg border border-[var(--control-border)] bg-[var(--control-bg)] pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground sm:w-64"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2 border-t border-clinq-glass-border/50 px-3 py-2.5 sm:px-6">
        <div className="flex items-center gap-2 overflow-x-auto">
          {onSourceFilterChange && sourceCounts ? (
            <>
              {(
                [
                  ["all", "All", sourceCounts.all],
                  ["imported", "Imported", sourceCounts.imported],
                  ["manual", "Manual", sourceCounts.manual],
                  ["freelancer", "Freelancer", sourceCounts.freelancer],
                ] as const
              ).map(([key, label, n]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => onSourceFilterChange(key)}
                  className={cn(
                    "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                    sourceFilter === key
                      ? "bg-primary/15 text-primary ring-1 ring-primary/30"
                      : "bg-muted/40 text-muted-foreground hover:bg-muted/55 hover:text-foreground",
                  )}
                >
                  {label} · {n}
                </button>
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
        {importSummaryLine ? (
          <p className="text-[11px] leading-snug text-muted-foreground">{importSummaryLine}</p>
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
