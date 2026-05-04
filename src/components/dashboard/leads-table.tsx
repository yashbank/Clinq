"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ArrowUpRight, Search, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { DashboardRecentLead } from "@/lib/dashboard-stats";
import type { PipelineStage } from "@/types/database";

function formatBudget(n: number | null) {
  if (n == null || Number.isNaN(n)) return "—";
  return `$${Number(n).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function stageLabel(stage: PipelineStage) {
  const labels: Record<PipelineStage, string> = {
    saved: "Saved",
    applied: "Applied",
    replied: "Replied",
    interview: "Interview",
    active: "Active",
    completed: "Completed",
  };
  return labels[stage] ?? stage;
}

function scoreTone(score: number) {
  if (score >= 80) return "text-clinq-success";
  if (score >= 60) return "text-clinq-warning";
  return "text-muted-foreground";
}

function hintFromMetadata(meta: Record<string, unknown>): string | null {
  const hint = meta.proposal_strategy_hint;
  if (typeof hint === "string" && hint.trim()) {
    const t = hint.trim();
    return t.length > 120 ? `${t.slice(0, 117)}…` : t;
  }
  const tier = meta.lead_tier;
  if (typeof tier === "string" && tier.trim()) return `Tier: ${tier}`;
  return null;
}

export function DashboardLeadsSnapshot({ leads }: { leads: DashboardRecentLead[] }) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return leads;
    return leads.filter(
      (l) =>
        l.client_name.toLowerCase().includes(s) ||
        (l.company ?? "").toLowerCase().includes(s) ||
        stageLabel(l.stage).toLowerCase().includes(s),
    );
  }, [leads, q]);

  if (leads.length === 0) {
    return (
      <div className="glass-card flex flex-col items-center justify-center overflow-hidden rounded-2xl border border-clinq-glass-border/60 px-6 py-16 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
          <Users className="h-6 w-6 text-primary" />
        </div>
        <h3 className="mt-5 text-base font-semibold text-foreground">No leads yet</h3>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
          Add your first opportunity so scores, stages, and pipeline reflect real work—not sample rows.
        </p>
        <Button className="mt-6" asChild>
          <Link href="/leads">Go to Leads</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="glass-card overflow-hidden rounded-2xl border border-clinq-glass-border/60">
      <div className="flex flex-col gap-4 border-b border-clinq-glass-border p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Recent leads</h3>
          <p className="text-sm text-muted-foreground">Latest updates from your workspace</p>
        </div>
        <div className="relative w-full sm:w-56">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            placeholder="Filter this list…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="h-9 w-full rounded-lg border border-clinq-glass-border bg-background/50 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/20"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead>
            <tr className="border-b border-clinq-glass-border bg-muted/20">
              <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Client
              </th>
              <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Budget
              </th>
              <th className="px-5 py-3 text-center text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Score
              </th>
              <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Stage
              </th>
              <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Updated
              </th>
              <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Note
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-clinq-glass-border/50">
            {filtered.map((lead) => {
              const hint = hintFromMetadata(lead.metadata);
              const updated = formatDistanceToNow(new Date(lead.updated_at), { addSuffix: true });
              return (
                <tr key={lead.id} className="transition-colors hover:bg-muted/15">
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-foreground">{lead.client_name}</p>
                    <p className="text-sm text-muted-foreground">{lead.company ?? "—"}</p>
                  </td>
                  <td className="px-5 py-3.5 text-sm tabular-nums text-foreground">{formatBudget(lead.budget)}</td>
                  <td className="px-5 py-3.5 text-center">
                    <span className={cn("text-sm font-semibold tabular-nums", scoreTone(lead.score))}>{lead.score}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="rounded-md border border-clinq-glass-border bg-background/40 px-2 py-0.5 text-xs font-medium text-foreground">
                      {stageLabel(lead.stage)}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-muted-foreground">{updated}</td>
                  <td className="max-w-[220px] px-5 py-3.5 text-sm leading-snug text-muted-foreground">{hint ?? "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-clinq-glass-border px-5 py-3">
        <p className="text-sm text-muted-foreground">
          Showing <span className="font-medium text-foreground">{filtered.length}</span> of{" "}
          <span className="font-medium text-foreground">{leads.length}</span> on dashboard
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
