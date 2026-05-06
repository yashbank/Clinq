"use client";

import {
  Users,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Shield,
  Target,
  ChevronRight,
  Eye,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const competitorData = [
  {
    lead: "TechFlow Inc",
    competitors: 2,
    yourPosition: 1,
    threat: "low",
    insight: "You have relationship advantage",
    priceGap: "-$2k",
    deliveryAdvantage: true,
  },
  {
    lead: "Quantum Labs",
    competitors: 4,
    yourPosition: 2,
    threat: "medium",
    insight: "Competitor has lower price",
    priceGap: "+$3.5k",
    deliveryAdvantage: true,
  },
  {
    lead: "Apex Ventures",
    competitors: 6,
    yourPosition: 4,
    threat: "high",
    insight: "Enterprise competitor preferred",
    priceGap: "+$8k",
    deliveryAdvantage: false,
  },
];

const marketStats = {
  avgCompetitors: 3.2,
  winRateVsComp: 68,
  pricingPosition: "Competitive",
  strengthAreas: ["Delivery Speed", "Quality", "Communication"],
};

function getThreatStyles(threat: string) {
  switch (threat) {
    case "low":
      return {
        bg: "bg-clinq-success/10",
        text: "text-clinq-success",
        border: "border-clinq-success/20",
        icon: Shield,
      };
    case "medium":
      return {
        bg: "bg-clinq-warning/10",
        text: "text-clinq-warning",
        border: "border-clinq-warning/20",
        icon: Eye,
      };
    case "high":
      return {
        bg: "bg-destructive/10",
        text: "text-destructive",
        border: "border-destructive/20",
        icon: AlertTriangle,
      };
    default:
      return {
        bg: "bg-muted/50",
        text: "text-muted-foreground",
        border: "border-border",
        icon: Users,
      };
  }
}

export function CompetitorAnalysis() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card/95 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-accent/20 to-primary/20">
            <Users className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Competitor Intel</h3>
            <p className="text-xs text-muted-foreground">
              AI-powered market position analysis
            </p>
          </div>
        </div>
      </div>

      {/* Market Stats */}
      <div className="grid grid-cols-2 gap-3 border-b border-border p-4">
        <div className="rounded-lg bg-muted/50 p-3 text-center">
          <div className="text-2xl font-bold text-clinq-success">
            {marketStats.winRateVsComp}%
          </div>
          <div className="text-[10px] text-muted-foreground">Win Rate vs Competition</div>
        </div>
        <div className="rounded-lg bg-muted/50 p-3 text-center">
          <div className="text-2xl font-bold text-foreground">
            {marketStats.avgCompetitors}
          </div>
          <div className="text-[10px] text-muted-foreground">Avg Competitors/Lead</div>
        </div>
      </div>

      {/* Competitor List */}
      <div className="p-4">
        <div className="space-y-3">
          {competitorData.map((item, i) => {
            const styles = getThreatStyles(item.threat);
            const ThreatIcon = styles.icon;

            return (
              <div
                key={i}
                className="rounded-xl border border-border bg-muted/30 p-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">{item.lead}</span>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize",
                        styles.bg,
                        styles.text,
                        styles.border
                      )}
                    >
                      <ThreatIcon className="h-3 w-3" />
                      {item.threat} threat
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">
                      {item.competitors}
                    </span>
                  </div>
                </div>

                <div className="mt-2 flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1">
                    <Target className="h-3 w-3 text-primary" />
                    <span className="text-muted-foreground">
                      Position:{" "}
                      <span
                        className={cn(
                          "font-medium",
                          item.yourPosition === 1 ? "text-clinq-success" : "text-foreground"
                        )}
                      >
                        #{item.yourPosition}
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {item.priceGap.startsWith("+") ? (
                      <TrendingUp className="h-3 w-3 text-destructive" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-clinq-success" />
                    )}
                    <span className="text-muted-foreground">
                      Price:{" "}
                      <span
                        className={cn(
                          "font-medium",
                          item.priceGap.startsWith("+")
                            ? "text-destructive"
                            : "text-clinq-success"
                        )}
                      >
                        {item.priceGap}
                      </span>
                    </span>
                  </div>
                  {item.deliveryAdvantage && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-clinq-success" />
                      <span className="text-clinq-success">Faster delivery</span>
                    </div>
                  )}
                </div>

                <p className="mt-2 text-xs text-muted-foreground">{item.insight}</p>
              </div>
            );
          })}
        </div>

        {/* Strength Areas */}
        <div className="mt-4">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            Your Competitive Advantages
          </div>
          <div className="flex flex-wrap gap-2">
            {marketStats.strengthAreas.map((area, i) => (
              <span
                key={i}
                className="rounded-full bg-clinq-success/10 px-2.5 py-1 text-xs font-medium text-clinq-success"
              >
                {area}
              </span>
            ))}
          </div>
        </div>

        <Button
          variant="ghost"
          className="mt-4 w-full gap-2 text-primary hover:text-primary"
        >
          Full Market Analysis
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
