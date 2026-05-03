"use client";

import {
  TrendingUp,
  Target,
  Eye,
  Clock,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Prediction {
  label: string;
  value: string | number;
  trend: "up" | "down" | "neutral";
  comparison: string;
  icon: React.ElementType;
  color: string;
}

const predictions: Prediction[] = [
  {
    label: "Win Probability",
    value: "78%",
    trend: "up",
    comparison: "+12% above average",
    icon: Target,
    color: "clinq-success",
  },
  {
    label: "Open Rate",
    value: "94%",
    trend: "up",
    comparison: "Premium mode boost",
    icon: Eye,
    color: "primary",
  },
  {
    label: "Response Time",
    value: "2.4h",
    trend: "up",
    comparison: "Fast responder client",
    icon: Clock,
    color: "accent",
  },
  {
    label: "Engagement Score",
    value: "8.5/10",
    trend: "neutral",
    comparison: "Strong interest signals",
    icon: MessageSquare,
    color: "clinq-warning",
  },
];

const strengthIndicators = [
  { text: "Strong ROI messaging matches client psychology", positive: true },
  { text: "Portfolio items highly relevant to requirements", positive: true },
  { text: "Pricing section missing - consider adding", positive: false },
  { text: "Call-to-action clear and compelling", positive: true },
];

const competitorInsight = {
  position: "Top 15%",
  avgCompetitors: 12,
  yourAdvantage: "Faster response + relevant portfolio",
};

export function PerformancePrediction() {
  return (
    <div className="glass-card rounded-2xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-clinq-glass-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-clinq-success/20">
            <TrendingUp className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">
              Performance Prediction
            </h3>
            <p className="text-xs text-muted-foreground">
              AI-powered success forecast
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 rounded-full bg-primary/20 px-2 py-0.5">
          <Sparkles className="h-3 w-3 text-primary" />
          <span className="text-[10px] font-medium text-primary">Live</span>
        </div>
      </div>

      {/* Main Prediction Circle */}
      <div className="flex items-center justify-center border-b border-clinq-glass-border p-6">
        <div className="relative">
          {/* Outer ring */}
          <svg className="h-28 w-28 -rotate-90">
            <circle
              cx="56"
              cy="56"
              r="50"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-clinq-glass"
            />
            <circle
              cx="56"
              cy="56"
              r="50"
              stroke="url(#gradient)"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${78 * 3.14} ${100 * 3.14}`}
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="oklch(0.7 0.15 200)" />
                <stop offset="100%" stopColor="oklch(0.7 0.18 160)" />
              </linearGradient>
            </defs>
          </svg>
          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-foreground">78%</span>
            <span className="text-xs text-muted-foreground">Win Rate</span>
          </div>
        </div>
      </div>

      {/* Predictions Grid */}
      <div className="grid grid-cols-2 gap-3 border-b border-clinq-glass-border p-4">
        {predictions.map((pred) => (
          <div
            key={pred.label}
            className="rounded-xl bg-clinq-glass/50 p-3"
          >
            <div className="flex items-center gap-2">
              <pred.icon
                className={cn(
                  "h-3.5 w-3.5",
                  pred.color === "clinq-success" && "text-clinq-success",
                  pred.color === "primary" && "text-primary",
                  pred.color === "accent" && "text-accent",
                  pred.color === "clinq-warning" && "text-clinq-warning"
                )}
              />
              <span className="text-[11px] text-muted-foreground">
                {pred.label}
              </span>
            </div>
            <div className="mt-1 flex items-end gap-1.5">
              <span className="text-lg font-bold text-foreground">
                {pred.value}
              </span>
              {pred.trend !== "neutral" && (
                <span
                  className={cn(
                    "mb-0.5 flex items-center text-[10px]",
                    pred.trend === "up"
                      ? "text-clinq-success"
                      : "text-destructive"
                  )}
                >
                  {pred.trend === "up" ? (
                    <ArrowUp className="h-3 w-3" />
                  ) : (
                    <ArrowDown className="h-3 w-3" />
                  )}
                </span>
              )}
            </div>
            <p className="mt-0.5 text-[10px] text-muted-foreground line-clamp-1">
              {pred.comparison}
            </p>
          </div>
        ))}
      </div>

      {/* Strength Indicators */}
      <div className="border-b border-clinq-glass-border p-4">
        <p className="mb-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Proposal Strength
        </p>
        <div className="space-y-2">
          {strengthIndicators.map((indicator, i) => (
            <div key={i} className="flex items-start gap-2">
              {indicator.positive ? (
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-clinq-success" />
              ) : (
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-clinq-warning" />
              )}
              <span
                className={cn(
                  "text-xs",
                  indicator.positive
                    ? "text-muted-foreground"
                    : "text-clinq-warning"
                )}
              >
                {indicator.text}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Competitor Insight */}
      <div className="p-4">
        <p className="mb-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Competitive Position
        </p>
        <div className="rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Your Position</span>
            <span className="text-lg font-bold text-primary">
              {competitorInsight.position}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
            <span>
              vs {competitorInsight.avgCompetitors} avg competitors
            </span>
          </div>
          <p className="mt-2 text-xs text-clinq-success">
            {competitorInsight.yourAdvantage}
          </p>
        </div>
      </div>
    </div>
  );
}
