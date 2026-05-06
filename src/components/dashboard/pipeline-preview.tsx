"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { formatUsdTotalForDisplay } from "@/lib/currency/format-pipeline-budget";
import { cn } from "@/lib/utils";
import type { DashboardStageRow } from "@/lib/dashboard-stats";

const BAR_COLORS = [
  "from-sky-500/80 to-sky-400/60",
  "from-primary/80 to-accent/60",
  "from-amber-500/70 to-amber-400/50",
  "from-violet-500/70 to-violet-400/50",
  "from-emerald-500/70 to-emerald-400/50",
  "from-teal-500/70 to-teal-400/50",
] as const;

export function PipelinePreview({
  stages,
  totalLeads,
  totalPipelineValueUsd,
  preferredCurrency,
  usdToForeignRates,
}: {
  stages: DashboardStageRow[];
  totalLeads: number;
  totalPipelineValueUsd: number;
  preferredCurrency: string;
  usdToForeignRates: Record<string, number> | null;
}) {
  const maxCount = Math.max(1, ...stages.map((s) => s.count));
  const fmt = (n: number) => formatUsdTotalForDisplay(n, preferredCurrency, usdToForeignRates);

  if (totalLeads === 0) {
    return (
      <div className="flex flex-col justify-center overflow-hidden rounded-2xl border border-border bg-card/95 p-8 text-center shadow-sm">
        <h3 className="text-sm font-semibold text-foreground">Pipeline</h3>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
          Stages reflect your saved leads. Add one on <span className="text-foreground">Leads</span>, then move cards on{" "}
          <span className="text-foreground">Pipeline</span>.
        </p>
        <Link
          href="/leads"
          className="mt-6 inline-flex items-center justify-center gap-2 self-center rounded-lg border border-border bg-background/60 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted/50 active:scale-[0.99]"
        >
          Add a lead
          <ArrowUpRight className="h-4 w-4 opacity-70" />
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card/95 shadow-sm">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <h3 className="font-semibold text-foreground">Pipeline</h3>
          <p className="text-xs text-muted-foreground">
            {totalLeads} lead{totalLeads !== 1 ? "s" : ""} · {fmt(totalPipelineValueUsd)} in budgets
          </p>
        </div>
        <Link
          href="/pipeline"
          className="flex items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:text-primary/85"
        >
          Open
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="p-5">
        <p className="mb-4 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">By stage</p>
        <div className="space-y-3">
          {stages.map((row, i) => (
            <div key={row.stage} className="group">
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="truncate text-sm font-medium text-foreground">{row.label}</span>
                  <span className="shrink-0 rounded-md bg-muted/40 px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-muted-foreground">
                    {row.count}
                  </span>
                </div>
                <span className="shrink-0 text-sm tabular-nums text-muted-foreground">{fmt(row.pipelineValue)}</span>
              </div>
              <div className="relative h-1.5 overflow-hidden rounded-full bg-muted/25">
                <div
                  className={cn(
                    "h-full rounded-full bg-gradient-to-r transition-[width] duration-500",
                    BAR_COLORS[i % BAR_COLORS.length],
                  )}
                  style={{ width: `${(row.count / maxCount) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
