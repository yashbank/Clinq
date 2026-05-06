"use client";

import { Users, DollarSign, Sparkles, Target } from "lucide-react";
import { PremiumEmpty } from "@/components/ui/premium-empty";
import { cn } from "@/lib/utils";

export type DashboardAnalyticsSnapshot = {
  activeLeads: number;
  highConversionLeads: number;
  revenueMtd: number;
  /** Revenue from completed projects, formatted in preferred currency. */
  revenueMtdDisplay: string;
  pipelineValue: number;
  /** Total pipeline in preferred currency (matches Leads). */
  pipelineValueDisplay: string;
  proposalsSent: number;
  winRatePct: number;
};

function buildStats(snapshot: DashboardAnalyticsSnapshot) {
  const s = snapshot;
  const hasLeads = s.activeLeads > 0;
  const pipelineLabel = s.pipelineValueDisplay;
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
      value: s.revenueMtdDisplay,
      subValue: hasLeads ? `${pipelineLabel} in lead budgets` : "From Projects marked completed",
      icon: DollarSign,
      accentColor: "from-accent to-accent/50",
    },
    {
      label: "Proposals logged",
      value: String(s.proposalsSent),
      subValue: "From Proposal studio saves",
      icon: Sparkles,
      accentColor: "from-clinq-warning to-clinq-warning/50",
    },
  ];
}

export function AnalyticsCards({ snapshot }: { snapshot: DashboardAnalyticsSnapshot }) {
  const isEmpty = snapshot.activeLeads === 0 && snapshot.proposalsSent === 0;

  if (isEmpty) {
    return (
      <PremiumEmpty
        icon={Target}
        title="Metrics start at zero"
        description="Add a lead and log a proposal to populate this row. Numbers are only from your workspace—nothing is fabricated."
        primary={{ label: "Add a lead", href: "/leads" }}
        secondary={{ label: "Proposal studio", href: "/proposals" }}
        className="border-border/50 bg-background/35 py-12"
      />
    );
  }

  const stats = buildStats(snapshot);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="group relative overflow-hidden rounded-xl border border-border bg-card/95 p-5 shadow-sm transition-shadow duration-200 hover:border-primary/15 hover:shadow-md"
        >
          <div
            className={cn(
              "pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-gradient-to-br opacity-[0.05] blur-2xl transition-opacity group-hover:opacity-[0.09]",
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
