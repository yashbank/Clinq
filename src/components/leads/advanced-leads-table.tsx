"use client";

import { useState } from "react";
import {
  MoreHorizontal,
  Mail,
  Phone,
  FileText,
  Sparkles,
  Clock,
  Repeat,
  TrendingUp,
  AlertTriangle,
  Shield,
  ChevronUp,
  ChevronDown,
  Calendar,
  Target,
  ExternalLink,
  MessageSquare,
  Eye,
  Zap,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { Lead } from "@/types/leads-ui";

type SortField = "aiScore" | "value" | "conversionScore" | "winProbability";
type SortDirection = "asc" | "desc";

interface AdvancedLeadsTableProps {
  leads: Lead[];
  selectedLead: string | null;
  onSelectLead: (id: string | null) => void;
  onAddLead?: () => void;
}

function TierBadge({ tier }: { tier: Lead["leadTier"] }) {
  const styles: Record<Lead["leadTier"], string> = {
    "high-value": "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
    standard: "border-clinq-glass-border bg-clinq-glass/50 text-muted-foreground",
    "low-signal": "border-amber-500/35 bg-amber-500/10 text-amber-200",
    "time-waster": "border-destructive/40 bg-destructive/10 text-destructive",
  };
  const labels: Record<Lead["leadTier"], string> = {
    "high-value": "High value",
    standard: "Standard",
    "low-signal": "Low signal",
    "time-waster": "Time risk",
  };
  return (
    <span
      className={cn(
        "rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        styles[tier],
      )}
    >
      {labels[tier]}
    </span>
  );
}

function getScoreColor(score: number) {
  if (score >= 85) return "text-clinq-success";
  if (score >= 70) return "text-primary";
  if (score >= 50) return "text-clinq-warning";
  return "text-destructive";
}

function getScoreRingColor(score: number) {
  if (score >= 85) return "stroke-clinq-success";
  if (score >= 70) return "stroke-primary";
  if (score >= 50) return "stroke-clinq-warning";
  return "stroke-destructive";
}

function getScoreBg(score: number) {
  if (score >= 85) return "bg-clinq-success/10";
  if (score >= 70) return "bg-primary/10";
  if (score >= 50) return "bg-clinq-warning/10";
  return "bg-destructive/10";
}

function CircularScore({
  score,
  size = 44,
  strokeWidth = 3,
}: {
  score: number;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="rotate-[-90deg]" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/20"
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
          className={cn("transition-all duration-700", getScoreRingColor(score))}
        />
      </svg>
      <span
        className={cn(
          "absolute inset-0 flex items-center justify-center text-xs font-bold",
          getScoreColor(score)
        )}
      >
        {score}
      </span>
    </div>
  );
}

function StatusBadge({ status }: { status: Lead["status"] }) {
  const config = {
    hot: {
      bg: "bg-clinq-success/10",
      text: "text-clinq-success",
      border: "border-clinq-success/30",
      dot: "bg-clinq-success",
      pulse: true,
    },
    warm: {
      bg: "bg-clinq-warning/10",
      text: "text-clinq-warning",
      border: "border-clinq-warning/30",
      dot: "bg-clinq-warning",
      pulse: false,
    },
    new: {
      bg: "bg-primary/10",
      text: "text-primary",
      border: "border-primary/30",
      dot: "bg-primary",
      pulse: false,
    },
    cold: {
      bg: "bg-muted/30",
      text: "text-muted-foreground",
      border: "border-border",
      dot: "bg-muted-foreground",
      pulse: false,
    },
  };

  const c = config[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium capitalize",
        c.bg,
        c.text,
        c.border
      )}
    >
      <span
        className={cn("h-1.5 w-1.5 rounded-full", c.dot, c.pulse && "animate-pulse")}
      />
      {status}
    </span>
  );
}

function ScamRiskBadge({ risk }: { risk: Lead["scamRisk"] }) {
  const config = {
    low: {
      icon: Shield,
      text: "Low Risk",
      class: "bg-clinq-success/10 text-clinq-success border-clinq-success/20",
    },
    medium: {
      icon: AlertTriangle,
      text: "Medium",
      class: "bg-clinq-warning/10 text-clinq-warning border-clinq-warning/20",
    },
    high: {
      icon: AlertTriangle,
      text: "High Risk",
      class: "bg-destructive/10 text-destructive border-destructive/20",
    },
  };

  const c = config[risk];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium",
        c.class
      )}
    >
      <c.icon className="h-3 w-3" />
      {c.text}
    </span>
  );
}

function ProposalStatusBadge({ status }: { status: Lead["proposalStatus"] }) {
  const config = {
    none: { icon: FileText, text: "No Proposal", class: "text-muted-foreground" },
    draft: { icon: FileText, text: "Draft", class: "text-muted-foreground" },
    sent: { icon: Mail, text: "Sent", class: "text-primary" },
    viewed: { icon: Eye, text: "Viewed", class: "text-clinq-warning" },
    accepted: { icon: CheckCircle, text: "Accepted", class: "text-clinq-success" },
    rejected: { icon: XCircle, text: "Rejected", class: "text-destructive" },
  };

  const c = config[status];

  return (
    <span className={cn("inline-flex items-center gap-1 text-xs font-medium", c.class)}>
      <c.icon className="h-3.5 w-3.5" />
      {c.text}
    </span>
  );
}

function BidUrgencyBadge({ urgency, time }: { urgency: Lead["bidUrgency"]; time: string }) {
  const isUrgent = urgency === "now" || urgency === "today";

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg px-2.5 py-1.5",
        isUrgent ? "bg-clinq-success/10" : "bg-muted/30"
      )}
    >
      <Clock
        className={cn(
          "h-3.5 w-3.5",
          isUrgent ? "text-clinq-success" : "text-muted-foreground"
        )}
      />
      <span
        className={cn(
          "text-xs font-medium",
          isUrgent ? "text-clinq-success" : "text-foreground"
        )}
      >
        {time}
      </span>
      {isUrgent && (
        <span className="flex h-2 w-2">
          <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-clinq-success opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-clinq-success" />
        </span>
      )}
    </div>
  );
}

export function AdvancedLeadsTable({
  leads,
  selectedLead,
  onSelectLead,
  onAddLead,
}: AdvancedLeadsTableProps) {
  const [sortField, setSortField] = useState<SortField>("aiScore");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  const sortedLeads = [...leads].sort((a, b) => {
    const modifier = sortDirection === "desc" ? -1 : 1;
    return (a[sortField] - b[sortField]) * modifier;
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "desc" ? "asc" : "desc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const SortHeader = ({
    field,
    children,
    className,
  }: {
    field: SortField;
    children: React.ReactNode;
    className?: string;
  }) => (
    <button
      onClick={() => handleSort(field)}
      className={cn(
        "group flex items-center gap-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground",
        className
      )}
    >
      {children}
      <span className="flex flex-col">
        <ChevronUp
          className={cn(
            "h-2.5 w-2.5 -mb-0.5",
            sortField === field && sortDirection === "asc"
              ? "text-primary"
              : "text-muted-foreground/40 group-hover:text-muted-foreground"
          )}
        />
        <ChevronDown
          className={cn(
            "h-2.5 w-2.5 -mt-0.5",
            sortField === field && sortDirection === "desc"
              ? "text-primary"
              : "text-muted-foreground/40 group-hover:text-muted-foreground"
          )}
        />
      </span>
    </button>
  );

  return (
    <div className="glass-card overflow-hidden rounded-2xl">
      {/* Table Header */}
      <div className="flex items-center justify-between border-b border-clinq-glass-border p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-accent/20">
            <Target className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">AI-Scored Leads</h3>
            <p className="text-xs text-muted-foreground">
              80+ scores are high-conversion — click a row for details
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Sparkles className="h-4 w-4 text-primary" />
          <span>
            Showing <span className="font-medium text-foreground">{leads.length}</span> leads
            {leads.filter((l) => l.aiScore >= 80).length > 0 && (
              <>
                {" "}
                ·{" "}
                <span className="font-medium text-clinq-success">
                  {leads.filter((l) => l.aiScore >= 80).length} high-conversion (80+)
                </span>
              </>
            )}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1400px]">
          <thead>
            <tr className="border-b border-clinq-glass-border bg-clinq-glass/30">
              <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Lead
              </th>
              <th className="px-4 py-3">
                <SortHeader field="value" className="justify-center">
                  Value
                </SortHeader>
              </th>
              <th className="px-4 py-3">
                <SortHeader field="aiScore" className="justify-center">
                  <Target className="mr-1 h-3 w-3" />
                  AI Score
                </SortHeader>
              </th>
              <th className="px-4 py-3">
                <SortHeader field="conversionScore" className="justify-center">
                  <TrendingUp className="mr-1 h-3 w-3" />
                  Conversion
                </SortHeader>
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Status
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Risk
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Best Time to Bid
                </div>
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Proposal
              </th>
              <th className="px-4 py-3">
                <SortHeader field="winProbability" className="justify-center">
                  Win %
                </SortHeader>
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  AI Insight
                </div>
              </th>
              <th className="px-4 py-3 text-right text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-clinq-glass-border/50">
            {sortedLeads.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-5 py-20 text-center">
                  <div className="mx-auto flex max-w-sm flex-col items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-clinq-glass-border bg-clinq-glass/40">
                      <Target className="h-7 w-7 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">No leads yet</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Capture a client opportunity — Clinq scores it and surfaces risk flags automatically.
                      </p>
                    </div>
                    {onAddLead ? (
                      <Button
                        type="button"
                        onClick={onAddLead}
                        className="bg-gradient-to-r from-primary to-accent text-primary-foreground"
                      >
                        Add your first lead
                      </Button>
                    ) : null}
                    <p className="text-xs text-muted-foreground">Tip: ⌘⇧L (Ctrl⇧L) quick-add from anywhere in the app.</p>
                  </div>
                </td>
              </tr>
            ) : null}
            {sortedLeads.map((lead) => (
              <tr
                key={lead.id}
                onClick={() => onSelectLead(lead.id)}
                onMouseEnter={() => setHoveredRow(lead.id)}
                onMouseLeave={() => setHoveredRow(null)}
                className={cn(
                  "group cursor-pointer transition-all duration-200",
                  selectedLead === lead.id
                    ? "bg-primary/5"
                    : "hover:bg-clinq-glass/40",
                  lead.bidUrgency === "now" && "border-l-2 border-l-clinq-success",
                  lead.aiScore >= 80 && getScoreBg(lead.aiScore),
                  lead.aiScore >= 80 && "ring-1 ring-inset ring-clinq-success/25"
                )}
              >
                {/* Lead Info */}
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div
                        className={cn(
                          "flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br font-medium text-foreground",
                          lead.isRepeatClient
                            ? "from-clinq-success/30 to-primary/30"
                            : "from-primary/30 to-accent/30"
                        )}
                      >
                        {lead.avatar}
                      </div>
                      {lead.isRepeatClient && (
                        <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-clinq-success shadow-lg shadow-clinq-success/30">
                          <Repeat className="h-3 w-3 text-background" />
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-foreground">{lead.name}</p>
                        {lead.sourceChannel === "freelancer" ? (
                          <span className="rounded border border-primary/20 bg-primary/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-primary">
                            Freelancer
                          </span>
                        ) : null}
                        <TierBadge tier={lead.leadTier} />
                        <span className="text-[10px] font-medium tabular-nums text-muted-foreground">
                          {lead.confidenceScore}% conf
                        </span>
                        {lead.isRepeatClient && (
                          <span className="rounded-full bg-clinq-success/10 px-1.5 py-0.5 text-[10px] font-semibold text-clinq-success">
                            {lead.projectsCompleted}x
                          </span>
                        )}
                      </div>
                      {lead.projectTitle ? (
                        <p className="mt-0.5 max-w-[240px] truncate text-xs text-muted-foreground">{lead.projectTitle}</p>
                      ) : null}
                      {lead.projectUrl ? (
                        <a
                          href={lead.projectUrl}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(ev) => ev.stopPropagation()}
                          className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Listing
                        </a>
                      ) : null}
                      <p className="text-sm text-muted-foreground">{lead.company}</p>
                      <p className="text-xs text-muted-foreground/70">{lead.industry}</p>
                    </div>
                  </div>
                </td>

                {/* Value */}
                <td className="px-4 py-4 text-center">
                  <span className="text-lg font-bold text-foreground">
                    {lead.value > 0 ? `$${(lead.value / 1000).toFixed(1)}k` : "—"}
                  </span>
                  {lead.isRepeatClient && lead.totalRevenue > 0 && (
                    <p className="text-[10px] text-muted-foreground">
                      ${(lead.totalRevenue / 1000).toFixed(0)}k lifetime
                    </p>
                  )}
                </td>

                {/* AI Score */}
                <td className="px-4 py-4">
                  <div className="flex justify-center">
                    <CircularScore score={lead.aiScore} />
                  </div>
                </td>

                {/* Conversion Score */}
                <td className="px-4 py-4">
                  <div className="flex justify-center">
                    <CircularScore score={lead.conversionScore} />
                  </div>
                </td>

                {/* Status */}
                <td className="px-4 py-4">
                  <StatusBadge status={lead.status} />
                </td>

                {/* Risk */}
                <td className="px-4 py-4">
                  <div className="flex flex-col items-center gap-1">
                    <ScamRiskBadge risk={lead.scamRisk} />
                    <span className="text-[10px] tabular-nums text-muted-foreground">
                      Serious {lead.seriousnessScore}
                    </span>
                  </div>
                </td>

                {/* Best Time to Bid */}
                <td className="px-4 py-4">
                  <BidUrgencyBadge urgency={lead.bidUrgency} time={lead.bestTimeToBid} />
                </td>

                {/* Proposal Status */}
                <td className="px-4 py-4">
                  <ProposalStatusBadge status={lead.proposalStatus} />
                </td>

                {/* Win Probability */}
                <td className="px-4 py-4">
                  <div className="flex flex-col items-center">
                    <span
                      className={cn(
                        "text-sm font-bold",
                        getScoreColor(lead.winProbability)
                      )}
                    >
                      {lead.winProbability}%
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {lead.competitorCount} competing
                    </span>
                  </div>
                </td>

                {/* AI Insight */}
                <td className="max-w-[220px] px-4 py-4">
                  <div className="flex items-start gap-2">
                    <Zap className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                    <span className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                      {lead.aiInsight}
                    </span>
                  </div>
                </td>

                {/* Actions */}
                <td className="px-4 py-4">
                  <div
                    className={cn(
                      "flex items-center justify-end gap-1 transition-opacity",
                      hoveredRow === lead.id ? "opacity-100" : "opacity-0"
                    )}
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:bg-primary/10 hover:text-primary"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Mail className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:bg-primary/10 hover:text-primary"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Phone className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:bg-primary/10 hover:text-primary"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <FileText className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:bg-clinq-glass hover:text-foreground"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-clinq-glass-border px-5 py-3">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{leads.length}</span> leads
          totaling{" "}
          <span className="font-medium text-foreground">
            ${(leads.reduce((sum, l) => sum + l.value, 0) / 1000).toFixed(0)}k
          </span>{" "}
          in potential value
        </p>
        <Button variant="ghost" className="gap-2 text-sm text-primary hover:text-primary">
          Export Intelligence Report
          <ExternalLink className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
