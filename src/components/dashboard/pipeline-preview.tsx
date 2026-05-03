"use client";

import { ArrowUpRight, TrendingUp, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const stages = [
  {
    name: "Discovery",
    count: 12,
    value: "$84,200",
    color: "from-blue-500 to-blue-400",
    percentage: 100,
  },
  {
    name: "Proposal",
    count: 8,
    value: "$156,400",
    color: "from-primary to-accent",
    percentage: 75,
  },
  {
    name: "Negotiation",
    count: 5,
    value: "$89,500",
    color: "from-clinq-warning to-yellow-400",
    percentage: 50,
  },
  {
    name: "Closing",
    count: 3,
    value: "$67,200",
    color: "from-clinq-success to-emerald-400",
    percentage: 25,
  },
];

const pipelineHealth = {
  score: 78,
  trend: "+12%",
  prediction: "$94.2K",
  confidence: 87,
};

export function PipelinePreview() {
  return (
    <div className="glass-card overflow-hidden rounded-2xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-clinq-glass-border px-5 py-4">
        <div>
          <h3 className="font-semibold text-foreground">Pipeline Overview</h3>
          <p className="text-xs text-muted-foreground">
            28 active opportunities
          </p>
        </div>
        <button className="flex items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:text-primary/80">
          View pipeline
          <ArrowUpRight className="h-4 w-4" />
        </button>
      </div>

      {/* Pipeline Health Score */}
      <div className="flex items-center gap-6 border-b border-clinq-glass-border px-5 py-4">
        <div className="relative">
          <svg className="h-20 w-20 rotate-[-90deg]">
            <circle
              cx="40"
              cy="40"
              r="32"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-muted/20"
            />
            <circle
              cx="40"
              cy="40"
              r="32"
              fill="none"
              strokeWidth="8"
              strokeDasharray={32 * 2 * Math.PI}
              strokeDashoffset={
                32 * 2 * Math.PI * (1 - pipelineHealth.score / 100)
              }
              strokeLinecap="round"
              className="text-clinq-success transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-bold text-foreground">
              {pipelineHealth.score}
            </span>
            <span className="text-[10px] text-muted-foreground">Health</span>
          </div>
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Predicted Revenue
            </span>
            <span className="font-semibold text-foreground">
              {pipelineHealth.prediction}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              AI Confidence
            </span>
            <span className="flex items-center gap-1 font-medium text-clinq-success">
              <Sparkles className="h-3.5 w-3.5" />
              {pipelineHealth.confidence}%
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">vs Last Month</span>
            <span className="flex items-center gap-1 font-medium text-clinq-success">
              <TrendingUp className="h-3.5 w-3.5" />
              {pipelineHealth.trend}
            </span>
          </div>
        </div>
      </div>

      {/* Funnel Stages */}
      <div className="p-5">
        <p className="mb-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Funnel Stages
        </p>
        <div className="space-y-3">
          {stages.map((stage, index) => (
            <div key={stage.name} className="group">
              <div className="mb-1.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">
                    {stage.name}
                  </span>
                  <span className="rounded bg-clinq-glass px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                    {stage.count}
                  </span>
                </div>
                <span className="text-sm font-semibold text-foreground">
                  {stage.value}
                </span>
              </div>
              <div className="relative h-2 overflow-hidden rounded-full bg-muted/30">
                <div
                  className={cn(
                    "h-full rounded-full bg-gradient-to-r transition-all duration-500 group-hover:opacity-90",
                    stage.color
                  )}
                  style={{ width: `${stage.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Insight */}
      <div className="border-t border-clinq-glass-border px-5 py-4">
        <div className="flex items-start gap-3 rounded-lg bg-primary/5 p-3">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p className="text-xs leading-relaxed text-muted-foreground">
            <span className="font-medium text-foreground">AI Insight:</span>{" "}
            Focus on moving 3 deals from Negotiation to Closing this week for
            optimal Q2 performance.
          </p>
        </div>
      </div>
    </div>
  );
}
