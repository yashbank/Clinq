"use client";

import { useState } from "react";
import {
  FileText,
  Sparkles,
  Send,
  Clock,
  ChevronRight,
  CheckCircle2,
  ArrowUpRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const recentProposals = [
  {
    id: 1,
    client: "TechFlow Inc",
    value: "$24,500",
    status: "draft",
    aiScore: 94,
    lastEdit: "2m ago",
  },
  {
    id: 2,
    client: "Quantum Labs",
    value: "$18,200",
    status: "sent",
    aiScore: 87,
    lastEdit: "1h ago",
  },
  {
    id: 3,
    client: "NovaStar Media",
    value: "$32,000",
    status: "viewed",
    aiScore: 82,
    lastEdit: "3h ago",
  },
];

const templates = [
  { name: "SaaS Development", winRate: "78%", uses: 24 },
  { name: "Brand Design", winRate: "65%", uses: 18 },
  { name: "Consulting", winRate: "72%", uses: 12 },
];

function getStatusStyles(status: string) {
  switch (status) {
    case "draft":
      return { bg: "bg-muted", text: "text-muted-foreground", label: "Draft" };
    case "sent":
      return { bg: "bg-primary/20", text: "text-primary", label: "Sent" };
    case "viewed":
      return {
        bg: "bg-clinq-success/20",
        text: "text-clinq-success",
        label: "Viewed",
      };
    default:
      return { bg: "bg-muted", text: "text-muted-foreground", label: status };
  }
}

export function ProposalWidget() {
  const [activeTab, setActiveTab] = useState<"recent" | "templates">("recent");

  return (
    <div className="glass-card overflow-hidden rounded-2xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-clinq-glass-border px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent">
            <FileText className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Proposal Studio</h3>
            <p className="text-xs text-muted-foreground">
              AI-powered proposals
            </p>
          </div>
        </div>
        <Button size="sm" className="gap-2 bg-primary/20 text-primary hover:bg-primary/30">
          <Sparkles className="h-3.5 w-3.5" />
          New Proposal
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-clinq-glass-border">
        <button
          onClick={() => setActiveTab("recent")}
          className={cn(
            "flex-1 px-4 py-2.5 text-sm font-medium transition-colors",
            activeTab === "recent"
              ? "border-b-2 border-primary text-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Recent
        </button>
        <button
          onClick={() => setActiveTab("templates")}
          className={cn(
            "flex-1 px-4 py-2.5 text-sm font-medium transition-colors",
            activeTab === "templates"
              ? "border-b-2 border-primary text-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Templates
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        {activeTab === "recent" ? (
          <div className="space-y-2">
            {recentProposals.map((proposal) => {
              const status = getStatusStyles(proposal.status);
              return (
                <div
                  key={proposal.id}
                  className="group flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-clinq-glass/50"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-clinq-glass">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">
                        {proposal.client}
                      </span>
                      <span
                        className={cn(
                          "rounded px-1.5 py-0.5 text-[10px] font-medium",
                          status.bg,
                          status.text
                        )}
                      >
                        {status.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{proposal.value}</span>
                      <span className="flex items-center gap-1">
                        <Sparkles className="h-3 w-3 text-primary" />
                        {proposal.aiScore}% match
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {proposal.lastEdit}
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-2">
            {templates.map((template) => (
              <div
                key={template.name}
                className="group flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-clinq-glass/50"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-accent/20">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <span className="font-medium text-foreground">
                    {template.name}
                  </span>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-clinq-success" />
                      {template.winRate} win rate
                    </span>
                    <span>{template.uses} uses</span>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="opacity-0 transition-opacity group-hover:opacity-100"
                >
                  Use
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-clinq-glass-border px-4 py-3">
        <button className="flex w-full items-center justify-center gap-2 text-sm font-medium text-primary transition-colors hover:text-primary/80">
          View all proposals
          <ArrowUpRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
