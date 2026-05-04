"use client";

import { useMemo, useState } from "react";
import {
  Search,
  Filter,
  ChevronDown,
  Sparkles,
  Target,
  TrendingUp,
  Shield,
  Clock,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function buildQuickFilters(leadCount: number, highScore: number, repeat: number) {
  return [
    { label: "All Leads", value: "all", count: leadCount },
    { label: "Score 80+", value: "high-score", count: highScore, icon: Target },
    { label: "Hot Leads", value: "hot", count: Math.max(0, Math.floor(leadCount * 0.12)) },
    { label: "Repeat Clients", value: "repeat", count: repeat },
    { label: "Bid Now", value: "bid-now", count: Math.min(leadCount, 8), icon: Clock },
    { label: "Low Risk", value: "low-risk", count: Math.max(0, leadCount - 2), icon: Shield },
  ];
}

const advancedFilters = [
  {
    label: "Score Range",
    options: ["All", "90+", "80-89", "70-79", "60-69", "Below 60"],
  },
  {
    label: "Risk Level",
    options: ["All", "Low Risk", "Medium Risk", "High Risk"],
  },
  {
    label: "Best Time",
    options: ["All", "Today", "Tomorrow", "This Week", "Next Week"],
  },
  {
    label: "Value Range",
    options: ["All", "$50k+", "$25k-50k", "$10k-25k", "Under $10k"],
  },
  { label: "Status", options: ["All", "Hot", "Warm", "New", "Cold"] },
  {
    label: "Proposal Status",
    options: ["All", "Draft", "Sent", "Viewed", "None"],
  },
];

export function LeadIntelligenceHeader({
  onAddLead,
  leadCount = 0,
  highScoreCount = 0,
  repeatCount = 0,
}: {
  onAddLead?: () => void;
  leadCount?: number;
  highScoreCount?: number;
  repeatCount?: number;
}) {
  const quickFilters = useMemo(
    () => buildQuickFilters(leadCount, highScoreCount, repeatCount),
    [leadCount, highScoreCount, repeatCount],
  );
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [activeAdvanced, setActiveAdvanced] = useState<
    Record<string, string>
  >({});

  const activeAdvancedCount = Object.values(activeAdvanced).filter(
    (v) => v && v !== "All"
  ).length;

  return (
    <header className="shrink-0 border-b border-clinq-glass-border bg-sidebar/50 backdrop-blur-xl">
      {/* Top Section */}
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-accent/20">
              <Target className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">
                Lead Intelligence
              </h1>
              <p className="text-sm text-muted-foreground">
                AI-powered lead scoring and opportunity detection
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {onAddLead ? (
            <Button
              type="button"
              onClick={onAddLead}
              className="gap-2 bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-95"
            >
              <Target className="h-4 w-4" />
              Add lead
            </Button>
          ) : null}
          {/* AI Analysis Button */}
          <Button
            variant="ghost"
            className="gap-2 border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary"
          >
            <Sparkles className="h-4 w-4" />
            AI Analysis
          </Button>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search leads, companies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 w-64 rounded-xl border border-clinq-glass-border bg-clinq-glass pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
              /
            </kbd>
          </div>

          {/* Advanced Filters Toggle */}
          <Button
            variant="ghost"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={cn(
              "gap-2",
              showAdvanced && "bg-clinq-glass text-foreground"
            )}
          >
            <Filter className="h-4 w-4" />
            Filters
            {activeAdvancedCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                {activeAdvancedCount}
              </span>
            )}
            <ChevronDown
              className={cn(
                "h-3 w-3 transition-transform",
                showAdvanced && "rotate-180"
              )}
            />
          </Button>
        </div>
      </div>

      {/* Quick Filters */}
      <div className="flex items-center gap-2 overflow-x-auto px-6 pb-3">
        {quickFilters.map((filter) => (
          <button
            key={filter.value}
            onClick={() => setActiveFilter(filter.value)}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all",
              activeFilter === filter.value
                ? "bg-primary/20 text-primary shadow-sm shadow-primary/10"
                : "text-muted-foreground hover:bg-clinq-glass hover:text-foreground"
            )}
          >
            {filter.icon && <filter.icon className="h-3.5 w-3.5" />}
            {filter.label}
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-xs",
                activeFilter === filter.value
                  ? "bg-primary/30"
                  : "bg-muted/50"
              )}
            >
              {filter.count}
            </span>
          </button>
        ))}
      </div>

      {/* Advanced Filters Panel */}
      {showAdvanced && (
        <div className="border-t border-clinq-glass-border bg-clinq-glass/30 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap items-center gap-3">
              {advancedFilters.map((filter) => (
                <div key={filter.label} className="relative">
                  <select
                    value={activeAdvanced[filter.label] || "All"}
                    onChange={(e) =>
                      setActiveAdvanced({
                        ...activeAdvanced,
                        [filter.label]: e.target.value,
                      })
                    }
                    className={cn(
                      "h-9 appearance-none rounded-lg border border-clinq-glass-border bg-clinq-glass px-3 pr-8 text-sm transition-colors focus:border-primary/50 focus:outline-none",
                      activeAdvanced[filter.label] &&
                        activeAdvanced[filter.label] !== "All"
                        ? "border-primary/40 text-foreground"
                        : "text-muted-foreground"
                    )}
                  >
                    {filter.options.map((opt) => (
                      <option key={opt} value={opt}>
                        {filter.label}: {opt}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                </div>
              ))}
            </div>

            {activeAdvancedCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveAdvanced({})}
                className="gap-1 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
                Clear all
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Stats Bar */}
      <div className="flex items-center justify-between border-t border-clinq-glass-border/50 bg-sidebar/30 px-6 py-2">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Total Value:</span>
            <span className="font-semibold text-foreground">$2.4M</span>
          </div>
          <div className="h-4 w-px bg-clinq-glass-border" />
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Avg Score:</span>
            <span className="font-semibold text-clinq-success">78.5</span>
          </div>
          <div className="h-4 w-px bg-clinq-glass-border" />
          <div className="flex items-center gap-2 text-sm">
            <TrendingUp className="h-3.5 w-3.5 text-clinq-success" />
            <span className="text-clinq-success">+12% this week</span>
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          Last AI analysis: <span className="text-foreground">2 min ago</span>
        </div>
      </div>
    </header>
  );
}
