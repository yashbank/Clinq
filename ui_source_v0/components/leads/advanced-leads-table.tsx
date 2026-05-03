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

interface Lead {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  avatar: string;
  value: number;
  aiScore: number;
  conversionScore: number;
  status: "hot" | "warm" | "new" | "cold";
  scamRisk: "low" | "medium" | "high";
  lastContact: string;
  aiInsight: string;
  bestTimeToBid: string;
  bidUrgency: "now" | "today" | "tomorrow" | "this-week" | "later";
  isRepeatClient: boolean;
  projectsCompleted: number;
  totalRevenue: number;
  responseRate: number;
  avgResponseTime: string;
  industry: string;
  proposalStatus: "none" | "draft" | "sent" | "viewed" | "accepted" | "rejected";
  competitorCount: number;
  winProbability: number;
}

const leads: Lead[] = [
  {
    id: "1",
    name: "Sarah Chen",
    company: "TechFlow Inc",
    email: "sarah@techflow.io",
    phone: "+1 (555) 123-4567",
    avatar: "SC",
    value: 24500,
    aiScore: 94,
    conversionScore: 91,
    status: "hot",
    scamRisk: "low",
    lastContact: "2h ago",
    aiInsight: "Decision maker engaged, budget confirmed. High urgency signal detected.",
    bestTimeToBid: "Now",
    bidUrgency: "now",
    isRepeatClient: true,
    projectsCompleted: 4,
    totalRevenue: 87500,
    responseRate: 96,
    avgResponseTime: "1.5h",
    industry: "SaaS",
    proposalStatus: "sent",
    competitorCount: 2,
    winProbability: 78,
  },
  {
    id: "2",
    name: "Michael Roberts",
    company: "Quantum Labs",
    email: "m.roberts@quantumlabs.com",
    phone: "+1 (555) 234-5678",
    avatar: "MR",
    value: 42000,
    aiScore: 88,
    conversionScore: 82,
    status: "hot",
    scamRisk: "low",
    lastContact: "4h ago",
    aiInsight: "Technical requirements align perfectly with your expertise.",
    bestTimeToBid: "Today 2 PM",
    bidUrgency: "today",
    isRepeatClient: false,
    projectsCompleted: 0,
    totalRevenue: 0,
    responseRate: 84,
    avgResponseTime: "3h",
    industry: "Biotech",
    proposalStatus: "draft",
    competitorCount: 4,
    winProbability: 65,
  },
  {
    id: "3",
    name: "Emma Williams",
    company: "NovaStar Media",
    email: "emma@novastar.co",
    phone: "+1 (555) 345-6789",
    avatar: "EW",
    value: 38000,
    aiScore: 85,
    conversionScore: 76,
    status: "warm",
    scamRisk: "low",
    lastContact: "1d ago",
    aiInsight: "Previous project success creates strong referral potential.",
    bestTimeToBid: "Tomorrow 10 AM",
    bidUrgency: "tomorrow",
    isRepeatClient: true,
    projectsCompleted: 6,
    totalRevenue: 142000,
    responseRate: 92,
    avgResponseTime: "2h",
    industry: "Media",
    proposalStatus: "viewed",
    competitorCount: 1,
    winProbability: 82,
  },
  {
    id: "4",
    name: "David Kim",
    company: "Apex Ventures",
    email: "dkim@apexvc.com",
    phone: "+1 (555) 456-7890",
    avatar: "DK",
    value: 65000,
    aiScore: 82,
    conversionScore: 68,
    status: "warm",
    scamRisk: "medium",
    lastContact: "2d ago",
    aiInsight: "Enterprise client, longer sales cycle expected. Multiple stakeholders.",
    bestTimeToBid: "Wed 3 PM",
    bidUrgency: "this-week",
    isRepeatClient: false,
    projectsCompleted: 0,
    totalRevenue: 0,
    responseRate: 72,
    avgResponseTime: "8h",
    industry: "Finance",
    proposalStatus: "none",
    competitorCount: 6,
    winProbability: 45,
  },
  {
    id: "5",
    name: "Lisa Anderson",
    company: "CloudBridge Solutions",
    email: "l.anderson@cloudbridge.io",
    phone: "+1 (555) 567-8901",
    avatar: "LA",
    value: 18500,
    aiScore: 76,
    conversionScore: 71,
    status: "new",
    scamRisk: "low",
    lastContact: "3d ago",
    aiInsight: "First-time client with clear project scope. Low competition.",
    bestTimeToBid: "This week",
    bidUrgency: "this-week",
    isRepeatClient: false,
    projectsCompleted: 0,
    totalRevenue: 0,
    responseRate: 78,
    avgResponseTime: "5h",
    industry: "Cloud",
    proposalStatus: "draft",
    competitorCount: 2,
    winProbability: 58,
  },
  {
    id: "6",
    name: "James Morrison",
    company: "Stellar Dynamics",
    email: "j.morrison@stellar.io",
    phone: "+1 (555) 678-9012",
    avatar: "JM",
    value: 31000,
    aiScore: 72,
    conversionScore: 64,
    status: "warm",
    scamRisk: "high",
    lastContact: "5d ago",
    aiInsight: "Unusual payment terms requested. Verify client authenticity.",
    bestTimeToBid: "Next week",
    bidUrgency: "later",
    isRepeatClient: false,
    projectsCompleted: 0,
    totalRevenue: 0,
    responseRate: 45,
    avgResponseTime: "24h",
    industry: "Aerospace",
    proposalStatus: "none",
    competitorCount: 3,
    winProbability: 32,
  },
  {
    id: "7",
    name: "Rachel Green",
    company: "Innovate Digital",
    email: "rachel@innovatedigital.com",
    phone: "+1 (555) 789-0123",
    avatar: "RG",
    value: 52000,
    aiScore: 91,
    conversionScore: 88,
    status: "hot",
    scamRisk: "low",
    lastContact: "6h ago",
    aiInsight: "Urgent timeline, premium budget. Perfect match for your services.",
    bestTimeToBid: "Now",
    bidUrgency: "now",
    isRepeatClient: true,
    projectsCompleted: 2,
    totalRevenue: 48000,
    responseRate: 98,
    avgResponseTime: "45m",
    industry: "E-commerce",
    proposalStatus: "accepted",
    competitorCount: 0,
    winProbability: 95,
  },
  {
    id: "8",
    name: "Thomas Wright",
    company: "NextGen Corp",
    email: "t.wright@nextgen.co",
    phone: "+1 (555) 890-1234",
    avatar: "TW",
    value: 28000,
    aiScore: 68,
    conversionScore: 55,
    status: "cold",
    scamRisk: "medium",
    lastContact: "2w ago",
    aiInsight: "Re-engagement recommended. Previous interest not followed up.",
    bestTimeToBid: "After outreach",
    bidUrgency: "later",
    isRepeatClient: false,
    projectsCompleted: 0,
    totalRevenue: 0,
    responseRate: 38,
    avgResponseTime: "48h",
    industry: "Manufacturing",
    proposalStatus: "rejected",
    competitorCount: 5,
    winProbability: 18,
  },
];

type SortField = "aiScore" | "value" | "conversionScore" | "winProbability";
type SortDirection = "asc" | "desc";

interface AdvancedLeadsTableProps {
  selectedLead: string | null;
  onSelectLead: (id: string | null) => void;
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
  selectedLead,
  onSelectLead,
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
              Click any row for detailed intelligence
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Sparkles className="h-4 w-4 text-primary" />
          <span>
            Showing <span className="font-medium text-foreground">{leads.length}</span>{" "}
            high-value leads
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
                  lead.bidUrgency === "now" && "border-l-2 border-l-clinq-success"
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
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground">{lead.name}</p>
                        {lead.isRepeatClient && (
                          <span className="rounded-full bg-clinq-success/10 px-1.5 py-0.5 text-[10px] font-semibold text-clinq-success">
                            {lead.projectsCompleted}x
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{lead.company}</p>
                      <p className="text-xs text-muted-foreground/70">{lead.industry}</p>
                    </div>
                  </div>
                </td>

                {/* Value */}
                <td className="px-4 py-4 text-center">
                  <span className="text-lg font-bold text-foreground">
                    ${(lead.value / 1000).toFixed(0)}k
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
                  <ScamRiskBadge risk={lead.scamRisk} />
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
