"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, ExternalLink, Search, Users } from "lucide-react";
import { PremiumEmpty } from "@/components/ui/premium-empty";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DashboardRecentLead } from "@/lib/dashboard-stats";

function scoreTone(score: number) {
  if (score >= 80) return "text-clinq-success";
  if (score >= 60) return "text-clinq-warning";
  return "text-muted-foreground";
}

export function DashboardLeadsSnapshot({ leads }: { leads: DashboardRecentLead[] }) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return leads;
    return leads.filter(
      (l) =>
        l.projectTitle.toLowerCase().includes(s) ||
        l.summaryLine.toLowerCase().includes(s) ||
        l.platformLabel.toLowerCase().includes(s),
    );
  }, [leads, q]);

  if (leads.length === 0) {
    return (
      <PremiumEmpty
        icon={Users}
        title="No leads on the board"
        description="Capture an opportunity on Leads so this snapshot shows your latest opportunities."
        primary={{ label: "Open Leads", href: "/leads" }}
        secondary={{ label: "Integrations", href: "/integrations" }}
        className="overflow-hidden rounded-2xl border border-border bg-card/90 py-14 shadow-sm"
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card/95 shadow-sm">
      <div className="flex flex-col gap-4 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-foreground sm:text-lg">Recent leads</h2>
          <p className="text-xs text-muted-foreground sm:text-sm">Same rows as Leads — quick scan from Overview.</p>
        </div>
        <div className="relative w-full sm:w-56">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            placeholder="Filter…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="h-9 w-full rounded-lg border border-border bg-background/50 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/20"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[780px]">
          <thead>
            <tr className="border-b border-border bg-muted/20">
              <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Project
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Platform
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Summary
              </th>
              <th className="px-4 py-3 text-center text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Score
              </th>
              <th className="px-4 py-3 text-right text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Budget
              </th>
              <th className="w-11 px-2 py-3 text-center text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Listing
              </th>
              <th className="px-4 py-3 text-right text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Proposal
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {filtered.map((lead) => (
              <tr key={lead.id} className="transition-colors duration-150 hover:bg-muted/20">
                <td className="max-w-[200px] px-4 py-3">
                  <Link
                    href={`/leads?q=${encodeURIComponent(lead.projectTitle)}`}
                    className="line-clamp-2 font-medium text-foreground hover:text-primary hover:underline"
                  >
                    {lead.projectTitle}
                  </Link>
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <span className="rounded-md border border-border bg-muted/30 px-2 py-0.5 text-xs font-medium text-foreground">
                    {lead.platformLabel}
                  </span>
                </td>
                <td className="max-w-[240px] px-4 py-3">
                  <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">{lead.summaryLine || "—"}</p>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={cn("text-sm font-semibold tabular-nums", scoreTone(lead.score))}>{lead.score}</span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-sm tabular-nums text-foreground">{lead.budgetLabel}</td>
                <td className="px-2 py-3 text-center">
                  {lead.listingUrl ? (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" asChild>
                      <a href={lead.listingUrl} target="_blank" rel="noopener noreferrer" title="Open listing" aria-label="Open listing">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <Button variant="ghost" size="sm" className="h-8 gap-1 text-primary" asChild>
                    <Link href={lead.proposalHref}>
                      Draft
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-border px-5 py-3">
        <p className="text-sm text-muted-foreground">
          Showing <span className="font-medium text-foreground">{filtered.length}</span> of{" "}
          <span className="font-medium text-foreground">{leads.length}</span>
        </p>
        <Button variant="ghost" size="sm" className="gap-2 text-primary hover:text-primary" asChild>
          <Link href="/leads">
            All leads
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
