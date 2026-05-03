"use client";

import {
  TrendingUp,
  TrendingDown,
  Users,
  FileText,
  DollarSign,
  Zap,
  Sparkles,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";

const stats = [
  {
    label: "Active Leads",
    value: "284",
    subValue: "47 hot",
    change: "+12.5%",
    trend: "up",
    icon: Users,
    accentColor: "from-primary to-primary/50",
    glowColor: "shadow-primary/20",
  },
  {
    label: "Win Rate",
    value: "68%",
    subValue: "+5% this month",
    change: "+8.2%",
    trend: "up",
    icon: Target,
    accentColor: "from-clinq-success to-clinq-success/50",
    glowColor: "shadow-clinq-success/20",
  },
  {
    label: "Revenue MTD",
    value: "$94.2K",
    subValue: "$142K pipeline",
    change: "+23.1%",
    trend: "up",
    icon: DollarSign,
    accentColor: "from-accent to-accent/50",
    glowColor: "shadow-accent/20",
  },
  {
    label: "AI Actions",
    value: "1,429",
    subValue: "23 today",
    change: "+18.4%",
    trend: "up",
    icon: Sparkles,
    accentColor: "from-clinq-warning to-clinq-warning/50",
    glowColor: "shadow-clinq-warning/20",
  },
];

export function AnalyticsCards() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className={cn(
            "glass-card glass-card-hover group relative overflow-hidden rounded-xl p-5",
            `hover:${stat.glowColor}`
          )}
        >
          {/* Background gradient accent */}
          <div
            className={cn(
              "absolute -right-6 -top-6 h-20 w-20 rounded-full bg-gradient-to-br opacity-[0.08] blur-2xl transition-opacity group-hover:opacity-20",
              stat.accentColor
            )}
          />

          <div className="relative">
            {/* Header */}
            <div className="mb-4 flex items-center justify-between">
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br",
                  stat.accentColor
                )}
              >
                <stat.icon className="h-5 w-5 text-background" />
              </div>
              <div className="flex items-center gap-1">
                {stat.trend === "up" ? (
                  <TrendingUp className="h-4 w-4 text-clinq-success" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-destructive" />
                )}
                <span
                  className={cn(
                    "text-sm font-semibold",
                    stat.trend === "up"
                      ? "text-clinq-success"
                      : "text-destructive"
                  )}
                >
                  {stat.change}
                </span>
              </div>
            </div>

            {/* Content */}
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </p>
              <div className="mt-1 flex items-baseline gap-2">
                <p className="text-2xl font-bold tracking-tight text-foreground">
                  {stat.value}
                </p>
                <p className="text-xs text-muted-foreground">{stat.subValue}</p>
              </div>
            </div>

            {/* Mini sparkline indicator */}
            <div className="mt-3 flex items-center gap-1">
              {[40, 65, 45, 80, 55, 90, 70].map((height, i) => (
                <div
                  key={i}
                  className={cn(
                    "w-1 rounded-full bg-gradient-to-t transition-all",
                    stat.accentColor
                  )}
                  style={{
                    height: `${height * 0.16}px`,
                    opacity: 0.3 + i * 0.1,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
