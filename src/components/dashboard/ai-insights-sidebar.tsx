"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, ArrowRight, KanbanSquare, FileText, Pin, PinOff, Users, PanelRight, ChevronDown, Lightbulb } from "lucide-react";

import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { DashboardRecommendation } from "@/lib/dashboard-recommendations";
import type { DashboardRecentLead } from "@/lib/dashboard-stats";

const PIN_KEY = "clinq-insights-pinned";

function InsightsPanelBody({
  recentLeads,
  proposalCount,
  recommendations,
  className,
}: {
  recentLeads: DashboardRecentLead[];
  proposalCount: number;
  recommendations: DashboardRecommendation[];
  className?: string;
}) {
  const top = [...recentLeads].sort((a, b) => b.score - a.score).slice(0, 3);
  const isEmpty = recentLeads.length === 0 && proposalCount === 0;

  return (
    <div className={cn("flex min-h-0 min-w-0 flex-1 flex-col", className)}>
      <div className="shrink-0 border-b border-clinq-glass-border/60 px-3 py-3 sm:px-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/12">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold leading-tight text-foreground">At a glance</h3>
            <p className="text-[11px] leading-snug text-muted-foreground">Your data only</p>
          </div>
        </div>
      </div>

      {isEmpty ? (
        <div className="flex min-h-0 flex-1 flex-col gap-3 p-3 sm:p-4">
          <p className="text-sm leading-relaxed text-muted-foreground">
            Add a lead to see top scores here. No sample rows.
          </p>
          <Link
            href="/leads"
            className="mt-auto inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-95"
          >
            Add a lead
            <ArrowRight className="h-4 w-4 shrink-0" />
          </Link>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3 sm:p-4">
          {top.length > 0 ? (
            <div className="min-w-0">
              <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Highest score</p>
              <ul className="space-y-1">
                {top.map((l) => (
                  <li key={l.id}>
                    <Link
                      href="/leads"
                      className="block rounded-lg border border-transparent px-2 py-1.5 transition-colors hover:border-clinq-glass-border hover:bg-clinq-glass/25"
                    >
                      <p className="truncate text-sm font-medium text-foreground">{l.client_name}</p>
                      <p className="text-xs text-muted-foreground">Score {l.score}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {recommendations.length > 0 ? (
            <Collapsible className="group/rec border-t border-clinq-glass-border/60 pt-3">
              <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 rounded-lg px-1 py-1.5 text-left transition-colors hover:bg-clinq-glass/20">
                <span className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  <Lightbulb className="h-3.5 w-3.5 text-primary" />
                  Suggestions
                </span>
                <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform group-data-[state=open]/rec:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <ul className="mt-2 space-y-2">
                  {recommendations.map((r) => (
                    <li key={r.id}>
                      <Link
                        href={r.href}
                        className="block rounded-lg border border-clinq-glass-border/40 bg-background/20 px-2.5 py-2 transition-colors hover:border-clinq-glass-border hover:bg-clinq-glass/25"
                      >
                        <p className="text-xs font-medium text-foreground">{r.title}</p>
                        <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{r.detail}</p>
                      </Link>
                    </li>
                  ))}
                </ul>
              </CollapsibleContent>
            </Collapsible>
          ) : null}

          <div className="mt-auto space-y-0.5 border-t border-clinq-glass-border/60 pt-2.5">
            <p className="mb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Shortcuts</p>
            <Link
              href="/proposals"
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-foreground transition-colors hover:bg-clinq-glass/30"
            >
              <FileText className="h-4 w-4 shrink-0 text-primary" />
              <span className="truncate">Proposal studio</span>
            </Link>
            <Link
              href="/pipeline"
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-foreground transition-colors hover:bg-clinq-glass/30"
            >
              <KanbanSquare className="h-4 w-4 shrink-0 text-primary" />
              <span className="truncate">Pipeline</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export function AIInsightsSidebar({
  recentLeads,
  proposalCount,
  recommendations = [],
}: {
  recentLeads: DashboardRecentLead[];
  proposalCount: number;
  recommendations?: DashboardRecommendation[];
}) {
  const [pinned, setPinned] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    try {
      setPinned(localStorage.getItem(PIN_KEY) === "1");
    } catch {
      /* ignore */
    }
  }, []);

  const togglePin = () => {
    const next = !pinned;
    setPinned(next);
    try {
      localStorage.setItem(PIN_KEY, next ? "1" : "0");
    } catch {
      /* ignore */
    }
  };

  return (
    <>
      {/* Desktop: fixed layout width — flyout expands left over main; no flex shrink of center column */}
      <div
        data-expanded={pinned ? "true" : "false"}
        className="group/insights relative hidden h-full w-[4.25rem] shrink-0 md:block"
      >
        <div className="flex h-full flex-col border-l border-clinq-glass-border/50 bg-sidebar/35">
          <div className="flex shrink-0 flex-col items-center border-b border-clinq-glass-border/50 py-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/12" title="At a glance">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <button
              type="button"
              onClick={togglePin}
              title={pinned ? "Unpin panel" : "Pin open"}
              className={cn(
                "mt-2 flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground",
                pinned && "text-primary",
              )}
              aria-pressed={pinned}
            >
              {pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
            </button>
          </div>

          <nav className="flex flex-1 flex-col items-center gap-1.5 py-2" aria-label="Insight shortcuts">
            <Link
              href="/leads"
              title="Leads"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-white/[0.05] hover:text-foreground"
            >
              <Users className="h-4 w-4" />
            </Link>
            <Link
              href="/proposals"
              title="Proposal studio"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-white/[0.05] hover:text-foreground"
            >
              <FileText className="h-4 w-4" />
            </Link>
            <Link
              href="/pipeline"
              title="Pipeline"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-white/[0.05] hover:text-foreground"
            >
              <KanbanSquare className="h-4 w-4" />
            </Link>
          </nav>
        </div>

        <div
          className={cn(
            "pointer-events-none absolute inset-y-0 right-full z-30 flex w-0 flex-col overflow-hidden border-y border-l border-transparent bg-sidebar/95 opacity-0 shadow-[0_0_0_1px_oklch(0.28_0.02_280/0.25)] backdrop-blur-md transition-[width,opacity,border-color] duration-300 ease-out",
            "group-hover/insights:pointer-events-auto group-hover/insights:w-56 group-hover/insights:border-clinq-glass-border/50 group-hover/insights:opacity-100",
            "group-data-[expanded=true]/insights:pointer-events-auto group-data-[expanded=true]/insights:w-56 group-data-[expanded=true]/insights:border-clinq-glass-border/50 group-data-[expanded=true]/insights:opacity-100",
          )}
        >
          <InsightsPanelBody recentLeads={recentLeads} proposalCount={proposalCount} recommendations={recommendations} />
        </div>
      </div>

      {/* Mobile: drawer only */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger asChild>
          <button
            type="button"
            className="fixed bottom-[5.5rem] right-4 z-40 flex h-11 w-11 items-center justify-center rounded-full border border-clinq-glass-border/60 bg-sidebar/90 text-primary shadow-md backdrop-blur-sm transition-transform hover:scale-[1.02] active:scale-[0.98] md:hidden"
            aria-label="Open insights"
          >
            <PanelRight className="h-5 w-5" />
          </button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[min(100%,20rem)] border-clinq-glass-border p-0 sm:max-w-sm">
          <SheetHeader className="sr-only">
            <SheetTitle>Insights</SheetTitle>
          </SheetHeader>
          <InsightsPanelBody
            recentLeads={recentLeads}
            proposalCount={proposalCount}
            recommendations={recommendations}
            className="h-full"
          />
        </SheetContent>
      </Sheet>
    </>
  );
}
