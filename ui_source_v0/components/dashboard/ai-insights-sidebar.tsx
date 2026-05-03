"use client";

import {
  Sparkles,
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Zap,
  Target,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";

const insights = [
  {
    type: "opportunity",
    icon: TrendingUp,
    title: "High-value opportunity",
    description:
      "TechFlow Inc shows 92% engagement. Optimal proposal window: Today 2-4 PM.",
    action: "Draft Proposal",
    priority: "high",
  },
  {
    type: "followup",
    icon: Clock,
    title: "Follow-up due",
    description:
      "Quantum Labs hasn't responded in 24h. Historical data suggests Thursday follow-ups convert 23% better.",
    action: "Send Follow-up",
    priority: "medium",
  },
  {
    type: "alert",
    icon: AlertCircle,
    title: "Pipeline risk",
    description:
      "NovaStar Media project has been idle for 3 days. Risk of losing to competitor.",
    action: "Take Action",
    priority: "high",
  },
  {
    type: "success",
    icon: CheckCircle2,
    title: "Win pattern detected",
    description:
      "Your SaaS proposals have 78% win rate. Similar opportunity from Apex Ventures detected.",
    action: "Apply Template",
    priority: "low",
  },
];

const aiStats = [
  { label: "AI Actions Today", value: "23", icon: Zap },
  { label: "Predicted Closes", value: "4", icon: Target },
  { label: "Optimal Bids", value: "7", icon: Calendar },
];

function getPriorityStyles(priority: string) {
  switch (priority) {
    case "high":
      return "border-l-clinq-success bg-clinq-success/5";
    case "medium":
      return "border-l-clinq-warning bg-clinq-warning/5";
    default:
      return "border-l-primary bg-primary/5";
  }
}

function getIconStyles(type: string) {
  switch (type) {
    case "opportunity":
      return "bg-clinq-success/20 text-clinq-success";
    case "followup":
      return "bg-clinq-warning/20 text-clinq-warning";
    case "alert":
      return "bg-destructive/20 text-destructive";
    case "success":
      return "bg-primary/20 text-primary";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export function AIInsightsSidebar() {
  return (
    <div className="flex h-full w-80 flex-col border-l border-clinq-glass-border bg-sidebar/50">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-clinq-glass-border px-5 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">AI Insights</h3>
          <p className="text-xs text-muted-foreground">Real-time intelligence</p>
        </div>
      </div>

      {/* AI Stats */}
      <div className="grid grid-cols-3 gap-2 border-b border-clinq-glass-border p-4">
        {aiStats.map((stat) => (
          <div
            key={stat.label}
            className="flex flex-col items-center rounded-lg bg-clinq-glass/30 p-2.5"
          >
            <stat.icon className="mb-1 h-4 w-4 text-primary" />
            <span className="text-lg font-semibold text-foreground">
              {stat.value}
            </span>
            <span className="text-center text-[10px] leading-tight text-muted-foreground">
              {stat.label}
            </span>
          </div>
        ))}
      </div>

      {/* Insights List */}
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Priority Actions
        </p>
        {insights.map((insight, index) => (
          <div
            key={index}
            className={cn(
              "group cursor-pointer rounded-lg border-l-2 p-3 transition-all hover:bg-clinq-glass/50",
              getPriorityStyles(insight.priority)
            )}
          >
            <div className="mb-2 flex items-start gap-2.5">
              <div
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
                  getIconStyles(insight.type)
                )}
              >
                <insight.icon className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-foreground">
                  {insight.title}
                </h4>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {insight.description}
                </p>
              </div>
            </div>
            <button className="flex items-center gap-1.5 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
              {insight.action}
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>

      {/* AI Summary */}
      <div className="border-t border-clinq-glass-border p-4">
        <div className="rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 p-4">
          <div className="mb-2 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">
              AI Daily Summary
            </span>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Your pipeline is{" "}
            <span className="font-medium text-clinq-success">18% stronger</span>{" "}
            than last week. Focus on TechFlow and Quantum Labs for highest ROI.
          </p>
        </div>
      </div>
    </div>
  );
}
