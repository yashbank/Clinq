"use client";

import {
  Brain,
  Target,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Heart,
  Shield,
  Zap,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PsychologyTrait {
  label: string;
  value: number;
  insight: string;
  icon: React.ElementType;
  color: string;
}

const psychologyTraits: PsychologyTrait[] = [
  {
    label: "Value-Driven",
    value: 85,
    insight: "Emphasize ROI and business outcomes",
    icon: TrendingUp,
    color: "clinq-success",
  },
  {
    label: "Risk-Averse",
    value: 72,
    insight: "Include guarantees and risk mitigation",
    icon: Shield,
    color: "primary",
  },
  {
    label: "Detail-Oriented",
    value: 68,
    insight: "Provide specific timelines and milestones",
    icon: Target,
    color: "accent",
  },
  {
    label: "Speed-Focused",
    value: 45,
    insight: "Quality matters more than speed here",
    icon: Zap,
    color: "clinq-warning",
  },
];

const communicationStyle = {
  preferred: "Professional yet approachable",
  avoid: "Overly casual language",
  keyPhrases: [
    "proven track record",
    "measurable results",
    "dedicated support",
    "transparent communication",
  ],
};

const painPoints = [
  {
    point: "Previous freelancer missed deadlines",
    priority: "high",
    suggestion: "Emphasize your reliability and tracking systems",
  },
  {
    point: "Budget concerns from past overruns",
    priority: "medium",
    suggestion: "Offer fixed-price or milestone-based pricing",
  },
  {
    point: "Worried about technical complexity",
    priority: "medium",
    suggestion: "Break down approach into simple phases",
  },
];

export function ClientPsychologyAnalysis() {
  return (
    <div className="glass-card rounded-2xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-clinq-glass-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-accent/20 to-primary/20">
            <Brain className="h-4 w-4 text-accent" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Client Psychology</h3>
            <p className="text-xs text-muted-foreground">
              AI-analyzed decision patterns
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 rounded-full bg-accent/20 px-2 py-0.5">
          <Sparkles className="h-3 w-3 text-accent" />
          <span className="text-[10px] font-medium text-accent">AI Analysis</span>
        </div>
      </div>

      {/* Psychology Traits */}
      <div className="border-b border-clinq-glass-border p-4">
        <p className="mb-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Decision Drivers
        </p>
        <div className="space-y-3">
          {psychologyTraits.map((trait) => (
            <div key={trait.label} className="group">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <trait.icon className={cn("h-3.5 w-3.5", `text-${trait.color}`)} />
                  <span className="text-sm font-medium text-foreground">
                    {trait.label}
                  </span>
                </div>
                <span className="text-xs font-semibold text-foreground">
                  {trait.value}%
                </span>
              </div>
              <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-clinq-glass">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    trait.color === "clinq-success" && "bg-clinq-success",
                    trait.color === "primary" && "bg-primary",
                    trait.color === "accent" && "bg-accent",
                    trait.color === "clinq-warning" && "bg-clinq-warning"
                  )}
                  style={{ width: `${trait.value}%` }}
                />
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                {trait.insight}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Communication Style */}
      <div className="border-b border-clinq-glass-border p-4">
        <p className="mb-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Communication Style
        </p>
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-clinq-success" />
            <div>
              <span className="text-xs font-medium text-foreground">Use: </span>
              <span className="text-xs text-muted-foreground">
                {communicationStyle.preferred}
              </span>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-clinq-warning" />
            <div>
              <span className="text-xs font-medium text-foreground">Avoid: </span>
              <span className="text-xs text-muted-foreground">
                {communicationStyle.avoid}
              </span>
            </div>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {communicationStyle.keyPhrases.map((phrase) => (
            <span
              key={phrase}
              className="rounded-full bg-clinq-success/10 px-2 py-0.5 text-[10px] font-medium text-clinq-success"
            >
              {`"${phrase}"`}
            </span>
          ))}
        </div>
      </div>

      {/* Pain Points */}
      <div className="p-4">
        <p className="mb-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Detected Pain Points
        </p>
        <div className="space-y-2">
          {painPoints.map((pain, i) => (
            <div
              key={i}
              className="group rounded-lg bg-clinq-glass/50 p-3 transition-colors hover:bg-clinq-glass"
            >
              <div className="flex items-start gap-2">
                <div
                  className={cn(
                    "mt-0.5 h-2 w-2 shrink-0 rounded-full",
                    pain.priority === "high"
                      ? "bg-destructive"
                      : "bg-clinq-warning"
                  )}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground">
                    {pain.point}
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {pain.suggestion}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
