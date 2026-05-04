"use client";

import {
  X,
  Mail,
  Phone,
  Globe,
  Clock,
  FileText,
  Sparkles,
  Target,
  Repeat,
  Shield,
  AlertTriangle,
  DollarSign,
  Zap,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { isHighConversionScore } from "@/lib/ai/lead-score";

import type { LeadRow } from "@/types/database";
import type { Lead } from "@/types/leads-ui";

export type LeadProfileDetail = { row: LeadRow; ui: Lead };

interface LeadProfilePanelProps {
  detail: LeadProfileDetail;
  onClose: () => void;
}

function CircularScore({ score, size = 52 }: { score: number; size?: number }) {
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;
  const ring =
    score >= 85
      ? "stroke-clinq-success"
      : score >= 70
        ? "stroke-primary"
        : score >= 50
          ? "stroke-clinq-warning"
          : "stroke-destructive";

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="rotate-[-90deg]" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="text-muted/20"
          stroke="currentColor"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={cn("transition-all duration-700", ring)}
          stroke="currentColor"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-foreground">
        {score}
      </span>
    </div>
  );
}

export function LeadProfilePanel({ detail, onClose }: LeadProfilePanelProps) {
  const { row, ui } = detail;
  const high = isHighConversionScore(row.score);

  const insights = [ui.aiInsight, row.project_description].filter(Boolean) as string[];

  return (
    <aside className="flex w-[420px] shrink-0 flex-col border-l border-clinq-glass-border bg-sidebar/80 backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-clinq-glass-border p-4">
        <div>
          <p className="text-xs text-muted-foreground">Lead</p>
          <h3 className="text-lg font-semibold text-foreground">{row.client_name}</h3>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="border-b border-clinq-glass-border p-5">
          <div className="flex items-start gap-4">
            <div className="relative">
              <div
                className={cn(
                  "flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br text-lg font-semibold text-foreground",
                  row.repeat_hire ? "from-clinq-success/30 to-primary/30" : "from-primary/30 to-accent/30",
                )}
              >
                {ui.avatar}
              </div>
              {row.repeat_hire ? (
                <div className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-clinq-success shadow-lg shadow-clinq-success/30">
                  <Repeat className="h-3.5 w-3.5 text-background" />
                </div>
              ) : null}
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm text-muted-foreground">{row.company || row.platform || "—"}</p>
                {high ? (
                  <span className="rounded-full bg-clinq-success/15 px-2 py-0.5 text-[10px] font-semibold text-clinq-success">
                    High conversion (80+)
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">Stage: {row.stage}</p>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <Button variant="ghost" size="sm" className="flex-1 gap-2 border border-clinq-glass-border" asChild>
              <a href={row.email ? `mailto:${row.email}` : "#"} aria-disabled={!row.email}>
                <Mail className="h-4 w-4" />
                Email
              </a>
            </Button>
            <Button variant="ghost" size="sm" className="flex-1 gap-2 border border-clinq-glass-border" asChild>
              <a href={row.phone ? `tel:${row.phone}` : "#"} aria-disabled={!row.phone}>
                <Phone className="h-4 w-4" />
                Call
              </a>
            </Button>
            <Button size="sm" className="flex-1 gap-2 bg-primary text-primary-foreground hover:bg-primary/90" asChild>
              <a href="/proposals">
                <FileText className="h-4 w-4" />
                Proposal
              </a>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 border-b border-clinq-glass-border p-5">
          <div className="flex flex-col items-center">
            <CircularScore score={row.score} />
            <span className="mt-2 text-xs text-muted-foreground">AI score</span>
          </div>
          <div className="flex flex-col items-center">
            <CircularScore score={ui.winProbability} />
            <span className="mt-2 text-xs text-muted-foreground">Win %</span>
          </div>
          <div className="flex flex-col items-center">
            <CircularScore score={ui.conversionScore} />
            <span className="mt-2 text-xs text-muted-foreground">Conversion</span>
          </div>
        </div>

        <div className="border-b border-clinq-glass-border p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-clinq-success" />
              <span className="text-sm text-muted-foreground">Budget</span>
            </div>
            <span className="text-2xl font-bold text-foreground">
              {row.budget != null ? `$${Number(row.budget).toLocaleString()}` : "—"}
            </span>
          </div>
        </div>

        <div className="border-b border-clinq-glass-border p-5">
          <div className="rounded-xl bg-primary/10 p-4">
            <div className="flex items-center gap-2 text-primary">
              <Zap className="h-4 w-4" />
              <span className="text-sm font-medium">Next action</span>
            </div>
            <p className="mt-2 font-semibold text-foreground">Draft a tailored proposal</p>
            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {ui.bestTimeToBid}
            </div>
          </div>
        </div>

        <div className="border-b border-clinq-glass-border p-5">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">AI insights</span>
          </div>
          <div className="space-y-2">
            {insights.map((insight, i) => (
              <div key={i} className="flex items-start gap-2 rounded-lg bg-clinq-glass/50 p-3">
                <Target className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
                <span className="text-xs leading-relaxed text-muted-foreground">{insight}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="border-b border-clinq-glass-border p-5">
          <span className="text-sm font-medium text-foreground">Contact</span>
          <div className="mt-3 space-y-3 text-sm">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">{row.email || "—"}</span>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">{row.phone || "—"}</span>
            </div>
            <div className="flex items-center gap-3">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">{row.platform || "—"}</span>
            </div>
          </div>
        </div>

        <div className="border-b border-clinq-glass-border p-5">
          <span className="text-sm font-medium text-foreground">Signals</span>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-clinq-glass px-2.5 py-1 text-muted-foreground">
              Competition {row.competition_level}/5
            </span>
            <span className="rounded-full bg-clinq-glass px-2.5 py-1 text-muted-foreground">
              Brief clarity {row.project_quality}/5
            </span>
            {ui.scamRisk === "low" ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-clinq-success/30 bg-clinq-success/10 px-2 py-1 text-clinq-success">
                <Shield className="h-3 w-3" />
                Lower risk profile
              </span>
            ) : ui.scamRisk === "high" ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-destructive/30 bg-destructive/10 px-2 py-1 text-destructive">
                <AlertTriangle className="h-3 w-3" />
                Higher diligence
              </span>
            ) : null}
          </div>
        </div>

        <div className="p-5">
          <span className="text-sm font-medium text-foreground">Notes</span>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{row.client_history || "—"}</p>
        </div>
      </div>

      <div className="border-t border-clinq-glass-border p-4">
        <Button className="w-full gap-2 bg-gradient-to-r from-primary to-accent text-primary-foreground" asChild>
          <a href="/proposals">
            <Sparkles className="h-4 w-4" />
            Open proposal studio
          </a>
        </Button>
      </div>
    </aside>
  );
}
