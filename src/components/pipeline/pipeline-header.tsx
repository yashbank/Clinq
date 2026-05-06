"use client";

import { useMemo } from "react";
import { Users, Activity, Brain, DollarSign, Clock } from "lucide-react";

import { MobileAppNav } from "@/components/dashboard/mobile-app-nav";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PipelineHeaderProps {
  onToggleAI: () => void;
  onToggleTimeline: () => void;
  showAIPanel: boolean;
  showTimeline: boolean;
  leadCount: number;
  totalBudgetLabel: string;
}

export function PipelineHeader({
  onToggleAI,
  onToggleTimeline,
  showAIPanel,
  showTimeline,
  leadCount,
  totalBudgetLabel,
}: PipelineHeaderProps) {
  const stats = useMemo(
    () => [
      { label: "Leads on board", value: String(leadCount), icon: Users },
      { label: "Budgets (sum)", value: totalBudgetLabel, icon: DollarSign },
    ],
    [leadCount, totalBudgetLabel],
  );

  return (
    <header className="shrink-0 border-b border-border bg-background/95 backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-3 px-3 py-3 sm:px-6 sm:py-4">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <MobileAppNav />
          <div className="flex min-w-0 items-center gap-3">
            <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 sm:flex">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-semibold text-foreground sm:text-xl">Pipeline</h1>
              <p className="truncate text-xs text-muted-foreground sm:text-sm">Stages from your saved leads</p>
            </div>
          </div>
        </div>

        <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleTimeline}
            className={cn(
              "shrink-0 gap-2 transition-colors duration-150",
              showTimeline && "bg-muted text-foreground",
            )}
          >
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Timeline</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleAI}
            className={cn(
              "shrink-0 gap-2 transition-colors duration-150 active:scale-[0.98]",
              showAIPanel && "bg-primary/10 text-primary",
            )}
          >
            <Brain className="h-4 w-4" />
            <span className="hidden sm:inline">Side panel</span>
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-6 border-t border-border/60 bg-muted/15 px-4 py-2.5 sm:px-6">
        {stats.map((stat) => (
          <div key={stat.label} className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/30">
              <stat.icon className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold tabular-nums text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          </div>
        ))}
        <div className="ml-auto hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
          <Clock className="h-3.5 w-3.5" />
          Drag cards to update stage
        </div>
      </div>
    </header>
  );
}
