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
    <aside className="flex h-full w-[min(100%,20rem)] shrink-0 flex-col border-l border-clinq-glass-border/60 bg-sidebar/40">
      <div className="flex items-center gap-3 border-b border-clinq-glass-border px-5 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary/80 to-accent/70">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">At a glance</h3>
          <p className="text-xs text-muted-foreground">Only your saved data</p>
        </div>
      </div>

      {isEmpty ? (
        <div className="flex flex-1 flex-col gap-4 p-5">
          <p className="text-sm leading-relaxed text-muted-foreground">
            Start in three calm steps. Nothing here is simulated—sections stay quiet until you add real records.
          </p>
          <ol className="space-y-3 text-sm">
            <li className="rounded-lg border border-clinq-glass-border/60 bg-background/30 px-3 py-2.5">
              <span className="font-medium text-foreground">1.</span> Save a lead
            </li>
            <li className="rounded-lg border border-clinq-glass-border/60 bg-background/30 px-3 py-2.5">
              <span className="font-medium text-foreground">2.</span> Draft a proposal in the studio
            </li>
            <li className="rounded-lg border border-clinq-glass-border/60 bg-background/30 px-3 py-2.5">
              <span className="font-medium text-foreground">3.</span> Move the card on Pipeline
            </li>
          </ol>
          <Link
            href="/leads"
            className="mt-auto inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-95"
          >
            Add your first lead
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-5">
          {top.length > 0 ? (
            <div>
              <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Highest score</p>
              <ul className="space-y-2">
                {top.map((l) => (
                  <li key={l.id}>
                    <Link
                      href="/leads"
                      className="block rounded-lg border border-transparent px-2 py-2 transition-colors hover:border-clinq-glass-border hover:bg-clinq-glass/30"
                    >
                      <p className="text-sm font-medium text-foreground">{l.client_name}</p>
                      <p className="text-xs text-muted-foreground">Score {l.score}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="mt-auto space-y-2 border-t border-clinq-glass-border pt-4">
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Shortcuts</p>
            <Link
              href="/proposals"
              className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-foreground hover:bg-clinq-glass/40"
            >
              <FileText className="h-4 w-4 text-primary" />
              Proposal studio
            </Link>
            <Link href="/pipeline" className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-foreground hover:bg-clinq-glass/40">
              <KanbanSquare className="h-4 w-4 text-primary" />
              Pipeline
            </Link>
          </div>
        </div>
      )}
    </aside>
  );
}
