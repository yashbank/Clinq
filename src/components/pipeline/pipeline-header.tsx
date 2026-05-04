"use client";

import { useState } from "react";
import {
  Users,
  Sparkles,
  Search,
  Filter,
  ChevronDown,
  Clock,
  DollarSign,
  TrendingUp,
  LayoutGrid,
  List,
  Activity,
  Brain,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PipelineHeaderProps {
  onToggleAI: () => void;
  onToggleTimeline: () => void;
  showAIPanel: boolean;
  showTimeline: boolean;
}

const pipelineStats = [
  { label: "Active Deals", value: "34", trend: "+5", icon: Users },
  { label: "Pipeline Value", value: "$847K", trend: "+12%", icon: DollarSign },
  { label: "Avg Close Time", value: "14d", trend: "-2d", icon: Clock },
  { label: "Win Rate", value: "68%", trend: "+4%", icon: TrendingUp },
];

export function PipelineHeader({
  onToggleAI,
  onToggleTimeline,
  showAIPanel,
  showTimeline,
}: PipelineHeaderProps) {
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <header className="shrink-0 border-b border-clinq-glass-border bg-background/85">
      {/* Top Section */}
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-accent/20">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-foreground">
                Pipeline & Workflow
              </h1>
              <span className="flex items-center gap-1 rounded-full bg-clinq-success/20 px-2 py-0.5 text-[10px] font-medium text-clinq-success">
                <span className="h-1.5 w-1.5 rounded-full bg-clinq-success animate-pulse" />
                Live
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Track and manage your client workflow with AI insights
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search clients, deals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 w-56 rounded-xl border border-clinq-glass-border bg-clinq-glass pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* View Toggle */}
          <div className="flex items-center rounded-lg border border-clinq-glass-border bg-clinq-glass p-1">
            <button
              onClick={() => setViewMode("kanban")}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm transition-colors",
                viewMode === "kanban"
                  ? "bg-primary/20 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm transition-colors",
                viewMode === "list"
                  ? "bg-primary/20 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <List className="h-4 w-4" />
            </button>
          </div>

          <div className="h-6 w-px bg-clinq-glass-border" />

          {/* Panel Toggles */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleTimeline}
            className={cn(
              "gap-2",
              showTimeline && "bg-clinq-glass text-foreground"
            )}
          >
            <Activity className="h-4 w-4" />
            Timeline
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleAI}
            className={cn(
              "gap-2",
              showAIPanel && "bg-primary/20 text-primary"
            )}
          >
            <Brain className="h-4 w-4" />
            AI Insights
          </Button>

          <Button className="gap-2 bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90">
            <Sparkles className="h-4 w-4" />
            AI Optimize
          </Button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="flex items-center justify-between border-t border-clinq-glass-border/50 bg-sidebar/30 px-6 py-3">
        <div className="flex items-center gap-8">
          {pipelineStats.map((stat) => (
            <div key={stat.label} className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-clinq-glass">
                <stat.icon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {stat.value}
                </p>
                <div className="flex items-center gap-1.5">
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <span className="text-[10px] text-clinq-success">
                    {stat.trend}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="flex h-2 w-2">
            <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
          </span>
          AI monitoring 34 active deals
        </div>
      </div>
    </header>
  );
}
