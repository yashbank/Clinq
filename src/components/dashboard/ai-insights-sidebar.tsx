"use client";

import Link from "next/link";
import { Sparkles, ArrowRight, KanbanSquare, FileText } from "lucide-react";
import type { DashboardRecentLead } from "@/lib/dashboard-stats";

export function AIInsightsSidebar({
  recentLeads,
  proposalCount,
}: {
  recentLeads: DashboardRecentLead[];
  proposalCount: number;
}) {
  const top = [...recentLeads].sort((a, b) => b.score - a.score).slice(0, 3);
  const isEmpty = recentLeads.length === 0 && proposalCount === 0;

  return (
    <aside className="hidden h-full w-[min(100%,18rem)] shrink-0 flex-col border-l border-clinq-glass-border/50 bg-sidebar/30 xl:flex">
      <div className="flex items-center gap-3 border-b border-clinq-glass-border/60 px-4 py-3.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-foreground">At a glance</h3>
          <p className="text-[11px] text-muted-foreground">Your data only</p>
        </div>
      </div>

      {isEmpty ? (
        <div className="flex flex-1 flex-col gap-4 p-4">
          <p className="text-sm leading-relaxed text-muted-foreground">
            Add a lead to see top scores here. No sample rows.
          </p>
          <Link
            href="/leads"
            className="mt-auto inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-95"
          >
            Add a lead
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
          {top.length > 0 ? (
            <div>
              <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Highest score</p>
              <ul className="space-y-1.5">
                {top.map((l) => (
                  <li key={l.id}>
                    <Link
                      href="/leads"
                      className="block rounded-lg border border-transparent px-2 py-2 transition-colors hover:border-clinq-glass-border hover:bg-clinq-glass/25"
                    >
                      <p className="text-sm font-medium text-foreground">{l.client_name}</p>
                      <p className="text-xs text-muted-foreground">Score {l.score}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="mt-auto space-y-1 border-t border-clinq-glass-border/60 pt-3">
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Shortcuts</p>
            <Link
              href="/proposals"
              className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-foreground hover:bg-clinq-glass/30"
            >
              <FileText className="h-4 w-4 text-primary" />
              Proposal studio
            </Link>
            <Link
              href="/pipeline"
              className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-foreground hover:bg-clinq-glass/30"
            >
              <KanbanSquare className="h-4 w-4 text-primary" />
              Pipeline
            </Link>
          </div>
        </div>
      )}
    </aside>
  );
}
