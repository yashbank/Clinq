"use client";

import { Users, DollarSign, Sparkles, Target } from "lucide-react";
import { cn } from "@/lib/utils";

export type DashboardAnalyticsSnapshot = {
  activeLeads: number;
  highConversionLeads: number;
  revenueMtd: number;
  pipelineValue: number;
  proposalsSent: number;
  winRatePct: number;
};

function formatUsd(n: number) {
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  if (n > 0) return `$${Math.round(n).toLocaleString()}`;
  return "$0";
}

function buildStats(snapshot: DashboardAnalyticsSnapshot) {
  const s = snapshot;
  const hasLeads = s.activeLeads > 0;
  return [
    {
      label: "Leads",
      value: String(s.activeLeads),
      subValue: hasLeads ? `${s.highConversionLeads} at 80+ score` : "Save opportunities on Leads",
      icon: Users,
      accentColor: "from-primary to-primary/50",
    },
    {
      label: "Win rate (completed ÷ leads)",
      value: `${Math.round(s.winRatePct)}%`,
      subValue: hasLeads ? `${s.proposalsSent} proposals logged` : "Appears when you log proposals",
      icon: Target,
      accentColor: "from-clinq-success to-clinq-success/50",
    },
    {
      label: "Revenue (completed projects)",
      value: formatUsd(s.revenueMtd),
      subValue: hasLeads ? `${formatUsd(s.pipelineValue)} in lead budgets` : "From Projects marked completed",
      icon: DollarSign,
      accentColor: "from-accent to-accent/50",
    },
    {
      label: "Proposals logged",
      value: String(s.proposalsSent),
      subValue: "Rows in your proposals table",
      icon: Sparkles,
      accentColor: "from-clinq-warning to-clinq-warning/50",
    },
  ];
}

export function AnalyticsCards({
  snapshot,
  variant = "grid",
}: {
  snapshot: DashboardAnalyticsSnapshot;
  variant?: "grid" | "compact";
}) {
  const stats = buildStats(snapshot);
  const isEmpty = snapshot.activeLeads === 0 && snapshot.proposalsSent === 0;

  if (variant === "compact" && isEmpty) {
    return (
      <div className="rounded-2xl border border-clinq-glass-border/60 bg-background/40 px-5 py-4 sm:px-6">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Metrics</span> stay at zero until you add leads and log proposals. Numbers below update from your database only.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className={cn(
            "glass-card group relative overflow-hidden rounded-xl border border-clinq-glass-border/60 p-5",
            isEmpty && "opacity-95",
          )}
        >
          <div
            className={cn(
              "pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-gradient-to-br opacity-[0.06] blur-2xl transition-opacity group-hover:opacity-[0.12]",
              stat.accentColor,
            )}
          />

          <div className="relative">
            <div className="mb-3 flex items-center justify-between">
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br",
                  stat.accentColor,
                )}
              >
                <stat.icon className="h-5 w-5 text-background" />
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
              <div className="mt-1">
                <p className="text-2xl font-semibold tracking-tight text-foreground">{stat.value}</p>
                <p className="mt-1 text-xs leading-snug text-muted-foreground">{stat.subValue}</p>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
