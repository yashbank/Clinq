"use client";

import {
  Sparkles,
  TrendingUp,
  Target,
  Clock,
  Zap,
  ArrowUpRight,
  ChevronRight,
  Flame,
  DollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const opportunities = [
  {
    id: 1,
    type: "urgent",
    title: "Bid Now Opportunity",
    description: "Sarah Chen at TechFlow Inc is ready to close. Decision expected today.",
    value: "$24.5k",
    action: "Send Proposal",
    priority: "critical",
    confidence: 94,
    timeLeft: "2 hours",
  },
  {
    id: 2,
    type: "high-value",
    title: "High-Value Lead Detected",
    description: "Quantum Labs showing strong buying signals. Budget confirmed at $42k.",
    value: "$42k",
    action: "Schedule Call",
    priority: "high",
    confidence: 88,
    timeLeft: "Today",
  },
  {
    id: 3,
    type: "repeat",
    title: "Repeat Client Opportunity",
    description: "Emma Williams (6 projects) has a new requirement matching your skills.",
    value: "$38k",
    action: "Review Brief",
    priority: "medium",
    confidence: 85,
    timeLeft: "Tomorrow",
  },
];

const quickStats = [
  { label: "Hot Leads", value: "18", change: "+5", trend: "up" },
  { label: "Bid Now", value: "3", change: "+2", trend: "up" },
  { label: "Total Pipeline", value: "$2.4M", change: "+12%", trend: "up" },
  { label: "Avg Win Rate", value: "68%", change: "+4%", trend: "up" },
];

function getPriorityStyles(priority: string) {
  switch (priority) {
    case "critical":
      return {
        bg: "bg-gradient-to-br from-clinq-success/20 to-clinq-success/5",
        border: "border-clinq-success/30",
        icon: "bg-clinq-success/20 text-clinq-success",
        badge: "bg-clinq-success/20 text-clinq-success",
      };
    case "high":
      return {
        bg: "bg-gradient-to-br from-primary/20 to-primary/5",
        border: "border-primary/30",
        icon: "bg-primary/20 text-primary",
        badge: "bg-primary/20 text-primary",
      };
    default:
      return {
        bg: "bg-gradient-to-br from-accent/20 to-accent/5",
        border: "border-accent/30",
        icon: "bg-accent/20 text-accent",
        badge: "bg-accent/20 text-accent",
      };
  }
}

function getTypeIcon(type: string) {
  switch (type) {
    case "urgent":
      return Flame;
    case "high-value":
      return DollarSign;
    case "repeat":
      return Target;
    default:
      return Zap;
  }
}

export function AIOpportunityInsights() {
  return (
    <div className="glass-card col-span-2 overflow-hidden rounded-2xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-clinq-glass-border p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-accent/20">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">AI Opportunity Radar</h3>
            <p className="text-xs text-muted-foreground">
              Real-time intelligence for maximum conversion
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2">
            <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-clinq-success opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-clinq-success" />
          </span>
          <span className="text-xs text-muted-foreground">Live</span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4 border-b border-clinq-glass-border p-5">
        {quickStats.map((stat, i) => (
          <div
            key={i}
            className="rounded-xl bg-clinq-glass/50 p-3 text-center"
          >
            <div className="text-xl font-bold text-foreground">{stat.value}</div>
            <div className="mt-1 flex items-center justify-center gap-1">
              <span className="text-xs text-muted-foreground">{stat.label}</span>
              <span
                className={cn(
                  "flex items-center text-[10px] font-medium",
                  stat.trend === "up" ? "text-clinq-success" : "text-destructive"
                )}
              >
                <TrendingUp className="h-3 w-3" />
                {stat.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Opportunities */}
      <div className="p-5">
        <div className="space-y-4">
          {opportunities.map((opp) => {
            const styles = getPriorityStyles(opp.priority);
            const Icon = getTypeIcon(opp.type);

            return (
              <div
                key={opp.id}
                className={cn(
                  "group relative rounded-xl border p-4 transition-all hover:shadow-lg",
                  styles.bg,
                  styles.border
                )}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                      styles.icon
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-foreground">{opp.title}</h4>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-medium",
                          styles.badge
                        )}
                      >
                        {opp.confidence}% confidence
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-1">
                      {opp.description}
                    </p>

                    <div className="mt-3 flex items-center gap-4">
                      <div className="flex items-center gap-1.5 text-sm">
                        <DollarSign className="h-3.5 w-3.5 text-clinq-success" />
                        <span className="font-semibold text-foreground">{opp.value}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-sm">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-muted-foreground">{opp.timeLeft}</span>
                      </div>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    className="shrink-0 gap-1.5 bg-foreground/10 text-foreground hover:bg-foreground/20"
                  >
                    {opp.action}
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Button>
                </div>

                {opp.priority === "critical" && (
                  <div className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-clinq-success opacity-75" />
                    <span className="relative inline-flex h-3 w-3 rounded-full bg-clinq-success" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <Button
          variant="ghost"
          className="mt-4 w-full gap-2 text-primary hover:text-primary"
        >
          View All Opportunities
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
