"use client";

import { useState } from "react";
import {
  MoreHorizontal,
  ArrowUpRight,
  Mail,
  Phone,
  Sparkles,
  Clock,
  Repeat,
  TrendingUp,
  Filter,
  Search,
  ChevronDown,
  Zap,
  Calendar,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const leads = [
  {
    id: 1,
    name: "Sarah Chen",
    company: "TechFlow Inc",
    email: "sarah@techflow.io",
    value: "$24,500",
    score: 92,
    conversionScore: 87,
    status: "Hot",
    lastContact: "2h ago",
    aiInsight: "High engagement, ready for proposal",
    bestTimeToBid: "Today 2-4 PM",
    isRepeatClient: true,
    projectsCompleted: 3,
    responseRate: "94%",
    avgResponseTime: "2h",
    industry: "SaaS",
  },
  {
    id: 2,
    name: "Michael Roberts",
    company: "Quantum Labs",
    email: "m.roberts@quantumlabs.com",
    value: "$18,200",
    score: 85,
    conversionScore: 72,
    status: "Warm",
    lastContact: "1d ago",
    aiInsight: "Needs follow-up on pricing",
    bestTimeToBid: "Tomorrow 10 AM",
    isRepeatClient: false,
    projectsCompleted: 0,
    responseRate: "78%",
    avgResponseTime: "6h",
    industry: "Biotech",
  },
  {
    id: 3,
    name: "Emma Williams",
    company: "NovaStar Media",
    email: "emma@novastar.co",
    value: "$32,000",
    score: 78,
    conversionScore: 65,
    status: "Warm",
    lastContact: "3d ago",
    aiInsight: "Decision maker identified",
    bestTimeToBid: "Wed 3 PM",
    isRepeatClient: true,
    projectsCompleted: 5,
    responseRate: "88%",
    avgResponseTime: "4h",
    industry: "Media",
  },
  {
    id: 4,
    name: "David Kim",
    company: "Apex Ventures",
    email: "dkim@apexvc.com",
    value: "$45,000",
    score: 65,
    conversionScore: 58,
    status: "New",
    lastContact: "5d ago",
    aiInsight: "Schedule discovery call",
    bestTimeToBid: "Thu 11 AM",
    isRepeatClient: false,
    projectsCompleted: 0,
    responseRate: "62%",
    avgResponseTime: "12h",
    industry: "Finance",
  },
  {
    id: 5,
    name: "Lisa Anderson",
    company: "CloudBridge Solutions",
    email: "l.anderson@cloudbridge.io",
    value: "$15,800",
    score: 58,
    conversionScore: 45,
    status: "Cold",
    lastContact: "2w ago",
    aiInsight: "Re-engagement campaign suggested",
    bestTimeToBid: "Next week",
    isRepeatClient: true,
    projectsCompleted: 2,
    responseRate: "55%",
    avgResponseTime: "24h",
    industry: "Cloud",
  },
];

const filters = [
  { label: "All Leads", value: "all" },
  { label: "Hot", value: "hot" },
  { label: "Warm", value: "warm" },
  { label: "New", value: "new" },
  { label: "Repeat Clients", value: "repeat" },
];

function getScoreColor(score: number) {
  if (score >= 80) return "text-clinq-success";
  if (score >= 60) return "text-clinq-warning";
  return "text-muted-foreground";
}

function getScoreRingColor(score: number) {
  if (score >= 80) return "stroke-clinq-success";
  if (score >= 60) return "stroke-clinq-warning";
  return "stroke-muted-foreground";
}

function getStatusColor(status: string) {
  switch (status) {
    case "Hot":
      return "bg-clinq-success/10 text-clinq-success border-clinq-success/20";
    case "Warm":
      return "bg-clinq-warning/10 text-clinq-warning border-clinq-warning/20";
    case "New":
      return "bg-primary/10 text-primary border-primary/20";
    default:
      return "bg-muted/50 text-muted-foreground border-border";
  }
}

function CircularScore({ score, size = 40 }: { score: number; size?: number }) {
  const strokeWidth = 3;
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
          className="text-muted/30"
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
          className={cn("transition-all duration-500", getScoreRingColor(score))}
        />
      </svg>
      <span
        className={cn(
          "absolute inset-0 flex items-center justify-center text-xs font-semibold",
          getScoreColor(score)
        )}
      >
        {score}
      </span>
    </div>
  );
}

export function LeadsTable() {
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="glass-card overflow-hidden rounded-2xl">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-clinq-glass-border p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            Lead Intelligence
          </h3>
          <p className="text-sm text-muted-foreground">
            AI-powered insights for elite conversion
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search leads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-48 rounded-lg border border-clinq-glass-border bg-clinq-glass pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/20"
            />
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <Filter className="h-4 w-4" />
            Filters
            <ChevronDown className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Smart Filters */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-clinq-glass-border px-5 py-3">
        {filters.map((filter) => (
          <button
            key={filter.value}
            onClick={() => setActiveFilter(filter.value)}
            className={cn(
              "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-all",
              activeFilter === filter.value
                ? "bg-primary/20 text-primary"
                : "text-muted-foreground hover:bg-clinq-glass hover:text-foreground"
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1100px]">
          <thead>
            <tr className="border-b border-clinq-glass-border bg-clinq-glass/30">
              <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Lead
              </th>
              <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Value
              </th>
              <th className="px-5 py-3 text-center text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                <div className="flex items-center justify-center gap-1">
                  <Target className="h-3 w-3" />
                  AI Score
                </div>
              </th>
              <th className="px-5 py-3 text-center text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                <div className="flex items-center justify-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Conversion
                </div>
              </th>
              <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Status
              </th>
              <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Best Time
                </div>
              </th>
              <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  AI Insight
                </div>
              </th>
              <th className="px-5 py-3 text-right text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-clinq-glass-border/50">
            {leads.map((lead) => (
              <tr
                key={lead.id}
                className="group transition-colors hover:bg-clinq-glass/30"
              >
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary/40 to-accent/40">
                        <span className="text-sm font-medium text-foreground">
                          {lead.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </span>
                      </div>
                      {lead.isRepeatClient && (
                        <div className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-clinq-success">
                          <Repeat className="h-2.5 w-2.5 text-background" />
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground">
                          {lead.name}
                        </p>
                        {lead.isRepeatClient && (
                          <span className="rounded bg-clinq-success/10 px-1.5 py-0.5 text-[10px] font-medium text-clinq-success">
                            {lead.projectsCompleted}x client
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {lead.company}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span className="text-base font-semibold text-foreground">
                    {lead.value}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <div className="flex justify-center">
                    <CircularScore score={lead.score} />
                  </div>
                </td>
                <td className="px-5 py-4">
                  <div className="flex justify-center">
                    <CircularScore score={lead.conversionScore} />
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-medium",
                      getStatusColor(lead.status)
                    )}
                  >
                    <span
                      className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        lead.status === "Hot" && "bg-clinq-success animate-pulse",
                        lead.status === "Warm" && "bg-clinq-warning",
                        lead.status === "New" && "bg-primary",
                        lead.status === "Cold" && "bg-muted-foreground"
                      )}
                    />
                    {lead.status}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-primary" />
                    <span className="text-sm font-medium text-foreground">
                      {lead.bestTimeToBid}
                    </span>
                  </div>
                </td>
                <td className="max-w-[200px] px-5 py-4">
                  <div className="flex items-start gap-2">
                    <Zap className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                    <span className="text-sm leading-tight text-muted-foreground">
                      {lead.aiInsight}
                    </span>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground opacity-0 transition-all hover:text-foreground group-hover:opacity-100"
                    >
                      <Mail className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground opacity-0 transition-all hover:text-foreground group-hover:opacity-100"
                    >
                      <Phone className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground opacity-0 transition-all hover:text-foreground group-hover:opacity-100"
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
          Showing <span className="font-medium text-foreground">5</span> of{" "}
          <span className="font-medium text-foreground">24</span> leads
        </p>
        <Button
          variant="ghost"
          className="gap-2 text-sm text-primary hover:text-primary"
        >
          View all leads
          <ArrowUpRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
