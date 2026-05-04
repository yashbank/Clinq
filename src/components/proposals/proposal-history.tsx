"use client";

import { useState } from "react";
import {
  X,
  Search,
  History,
  FileText,
  CheckCircle2,
  Clock,
  XCircle,
  Eye,
  Copy,
  MoreHorizontal,
  TrendingUp,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ProposalHistoryProps {
  onClose: () => void;
}

type ProposalStatus = "won" | "pending" | "viewed" | "rejected";

interface ProposalRecord {
  id: number;
  title: string;
  client: string;
  value: string;
  status: ProposalStatus;
  sentDate: string;
  viewedDate?: string;
  aiScore: number;
  wordCount: number;
  mode: "premium" | "concise" | "technical";
}

const proposals: ProposalRecord[] = [
  {
    id: 1,
    title: "SaaS Platform Development",
    client: "TechFlow Inc",
    value: "$24,500",
    status: "won",
    sentDate: "2 days ago",
    viewedDate: "1 day ago",
    aiScore: 94,
    wordCount: 485,
    mode: "premium",
  },
  {
    id: 2,
    title: "E-commerce Redesign",
    client: "StyleHub",
    value: "$18,000",
    status: "viewed",
    sentDate: "4 days ago",
    viewedDate: "3 days ago",
    aiScore: 88,
    wordCount: 320,
    mode: "premium",
  },
  {
    id: 3,
    title: "Mobile App MVP",
    client: "HealthTrack",
    value: "$32,000",
    status: "pending",
    sentDate: "5 days ago",
    aiScore: 82,
    wordCount: 245,
    mode: "concise",
  },
  {
    id: 4,
    title: "API Integration",
    client: "DataSync Corp",
    value: "$12,500",
    status: "rejected",
    sentDate: "1 week ago",
    viewedDate: "6 days ago",
    aiScore: 71,
    wordCount: 580,
    mode: "technical",
  },
  {
    id: 5,
    title: "Dashboard Analytics",
    client: "MetricsPro",
    value: "$15,000",
    status: "won",
    sentDate: "2 weeks ago",
    viewedDate: "2 weeks ago",
    aiScore: 91,
    wordCount: 410,
    mode: "premium",
  },
];

const stats = {
  totalSent: 24,
  winRate: 68,
  avgViewTime: "4.2 min",
  avgScore: 85,
};

function getStatusConfig(status: ProposalStatus) {
  switch (status) {
    case "won":
      return {
        label: "Won",
        icon: CheckCircle2,
        color: "text-clinq-success",
        bg: "bg-clinq-success/15",
      };
    case "viewed":
      return {
        label: "Viewed",
        icon: Eye,
        color: "text-primary",
        bg: "bg-primary/15",
      };
    case "pending":
      return {
        label: "Pending",
        icon: Clock,
        color: "text-clinq-warning",
        bg: "bg-clinq-warning/15",
      };
    case "rejected":
      return {
        label: "Rejected",
        icon: XCircle,
        color: "text-destructive",
        bg: "bg-destructive/15",
      };
  }
}

export function ProposalHistory({ onClose }: ProposalHistoryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProposalStatus | "all">("all");

  const filteredProposals = proposals.filter((proposal) => {
    const matchesSearch =
      proposal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      proposal.client.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || proposal.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative ml-auto flex h-full w-full max-w-3xl flex-col border-l border-clinq-glass-border bg-sidebar">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-clinq-glass-border px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-accent/20">
              <History className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Proposal History
              </h2>
              <p className="text-sm text-muted-foreground">
                Track performance and learn from past proposals
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-4 gap-4 border-b border-clinq-glass-border px-6 py-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">
              {stats.totalSent}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              Total Sent
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-clinq-success">
              {stats.winRate}%
            </div>
            <div className="mt-1 text-xs text-muted-foreground">Win Rate</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {stats.avgViewTime}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              Avg View Time
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-accent">{stats.avgScore}</div>
            <div className="mt-1 text-xs text-muted-foreground">
              Avg AI Score
            </div>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex items-center gap-3 border-b border-clinq-glass-border px-6 py-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search proposals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 w-full rounded-xl border border-clinq-glass-border bg-clinq-glass pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="flex items-center gap-2">
            {(["all", "won", "viewed", "pending", "rejected"] as const).map(
              (status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                    statusFilter === status
                      ? "bg-primary/20 text-primary"
                      : "text-muted-foreground hover:bg-clinq-glass hover:text-foreground"
                  )}
                >
                  {status === "all" ? "All" : status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              )
            )}
          </div>
        </div>

        {/* Proposals List */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-3">
            {filteredProposals.map((proposal) => {
              const statusConfig = getStatusConfig(proposal.status);
              return (
                <div
                  key={proposal.id}
                  className="group rounded-xl border border-clinq-glass-border bg-clinq-glass/30 p-4 transition-all hover:border-clinq-glass-border hover:bg-clinq-glass/50"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-clinq-glass">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground">
                          {proposal.title}
                        </h4>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          {proposal.client}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                          statusConfig.bg,
                          statusConfig.color
                        )}
                      >
                        <statusConfig.icon className="h-3 w-3" />
                        {statusConfig.label}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-6 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="text-muted-foreground">Value:</span>
                      <span className="font-semibold text-foreground">
                        {proposal.value}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-muted-foreground">Sent:</span>
                      <span className="text-foreground">{proposal.sentDate}</span>
                    </div>
                    {proposal.viewedDate && (
                      <div className="flex items-center gap-1.5">
                        <Eye className="h-3 w-3 text-muted-foreground" />
                        <span className="text-foreground">
                          {proposal.viewedDate}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="h-3 w-3 text-primary" />
                      <span className="text-muted-foreground">AI Score:</span>
                      <span
                        className={cn(
                          "font-medium",
                          proposal.aiScore >= 85
                            ? "text-clinq-success"
                            : proposal.aiScore >= 70
                            ? "text-clinq-warning"
                            : "text-destructive"
                        )}
                      >
                        {proposal.aiScore}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="rounded bg-clinq-glass px-1.5 py-0.5 text-[10px] text-muted-foreground">
                        {proposal.mode}
                      </span>
                    </div>
                    <div className="text-muted-foreground">
                      {proposal.wordCount} words
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 gap-1 px-2 text-xs"
                    >
                      <Eye className="h-3 w-3" />
                      View
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 gap-1 px-2 text-xs"
                    >
                      <Copy className="h-3 w-3" />
                      Use as Template
                    </Button>
                    {proposal.status === "won" && (
                      <span className="ml-auto flex items-center gap-1 text-xs text-clinq-success">
                        <TrendingUp className="h-3 w-3" />
                        Analyze what worked
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
