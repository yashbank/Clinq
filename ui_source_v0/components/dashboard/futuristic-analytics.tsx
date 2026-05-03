"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { TrendingUp, Sparkles, Calendar, ArrowUpRight } from "lucide-react";

const revenueData = [
  { month: "Jan", revenue: 18500, predicted: 17000 },
  { month: "Feb", revenue: 22400, predicted: 21000 },
  { month: "Mar", revenue: 19800, predicted: 20500 },
  { month: "Apr", revenue: 28100, predicted: 26000 },
  { month: "May", revenue: 31200, predicted: 29000 },
  { month: "Jun", revenue: 35600, predicted: 33000 },
  { month: "Jul", revenue: 42100, predicted: 40000 },
];

const conversionData = [
  { stage: "Leads", value: 100, fill: "url(#barGradient1)" },
  { stage: "Qualified", value: 72, fill: "url(#barGradient2)" },
  { stage: "Proposal", value: 48, fill: "url(#barGradient3)" },
  { stage: "Won", value: 28, fill: "url(#barGradient4)" },
];

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; dataKey: string }>;
  label?: string;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-clinq-glass-border bg-popover/95 px-3 py-2 shadow-xl backdrop-blur-sm">
        <p className="mb-1 text-xs font-medium text-muted-foreground">
          {label}
        </p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm font-semibold text-foreground">
            {entry.dataKey === "revenue" ? "Actual" : "Predicted"}: $
            {entry.value.toLocaleString()}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function FuturisticAnalytics() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Revenue Trend */}
      <div className="glass-card overflow-hidden rounded-2xl">
        <div className="flex items-center justify-between border-b border-clinq-glass-border px-5 py-4">
          <div>
            <h3 className="font-semibold text-foreground">Revenue Trend</h3>
            <p className="text-xs text-muted-foreground">
              Actual vs AI predicted
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary" />
              <span className="text-xs text-muted-foreground">Actual</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-accent opacity-50" />
              <span className="text-xs text-muted-foreground">Predicted</span>
            </div>
          </div>
        </div>
        <div className="p-5">
          <div className="mb-4 flex items-end gap-2">
            <span className="text-3xl font-bold text-foreground">$42.1K</span>
            <span className="mb-1 flex items-center gap-1 text-sm font-medium text-clinq-success">
              <TrendingUp className="h-4 w-4" />
              +18.3%
            </span>
          </div>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient
                    id="revenueGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="oklch(0.7 0.15 200)"
                      stopOpacity={0.4}
                    />
                    <stop
                      offset="100%"
                      stopColor="oklch(0.7 0.15 200)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                  <linearGradient
                    id="predictedGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="oklch(0.65 0.2 180)"
                      stopOpacity={0.2}
                    />
                    <stop
                      offset="100%"
                      stopColor="oklch(0.65 0.2 180)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="oklch(0.25 0.02 280 / 0.3)"
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "oklch(0.6 0 0)", fontSize: 11 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "oklch(0.6 0 0)", fontSize: 11 }}
                  tickFormatter={(value) => `$${value / 1000}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="predicted"
                  stroke="oklch(0.65 0.2 180 / 0.5)"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  fill="url(#predictedGradient)"
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="oklch(0.7 0.15 200)"
                  strokeWidth={2}
                  fill="url(#revenueGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        {/* AI Prediction */}
        <div className="border-t border-clinq-glass-border px-5 py-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span>
              AI predicts{" "}
              <span className="font-medium text-foreground">$48.2K</span> for
              August based on current pipeline
            </span>
          </div>
        </div>
      </div>

      {/* Conversion Funnel */}
      <div className="glass-card overflow-hidden rounded-2xl">
        <div className="flex items-center justify-between border-b border-clinq-glass-border px-5 py-4">
          <div>
            <h3 className="font-semibold text-foreground">Conversion Funnel</h3>
            <p className="text-xs text-muted-foreground">
              Lead to close rate: 28%
            </p>
          </div>
          <button className="flex items-center gap-1.5 text-sm font-medium text-primary">
            Details
            <ArrowUpRight className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Last 30 days
              </span>
            </div>
            <span className="flex items-center gap-1 text-sm font-medium text-clinq-success">
              <TrendingUp className="h-4 w-4" />
              +5.2% vs prev
            </span>
          </div>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={conversionData} layout="vertical" barSize={24}>
                <defs>
                  <linearGradient
                    id="barGradient1"
                    x1="0"
                    y1="0"
                    x2="1"
                    y2="0"
                  >
                    <stop offset="0%" stopColor="oklch(0.5 0.12 200)" />
                    <stop offset="100%" stopColor="oklch(0.7 0.15 200)" />
                  </linearGradient>
                  <linearGradient
                    id="barGradient2"
                    x1="0"
                    y1="0"
                    x2="1"
                    y2="0"
                  >
                    <stop offset="0%" stopColor="oklch(0.55 0.15 190)" />
                    <stop offset="100%" stopColor="oklch(0.65 0.2 180)" />
                  </linearGradient>
                  <linearGradient
                    id="barGradient3"
                    x1="0"
                    y1="0"
                    x2="1"
                    y2="0"
                  >
                    <stop offset="0%" stopColor="oklch(0.65 0.12 100)" />
                    <stop offset="100%" stopColor="oklch(0.8 0.15 80)" />
                  </linearGradient>
                  <linearGradient
                    id="barGradient4"
                    x1="0"
                    y1="0"
                    x2="1"
                    y2="0"
                  >
                    <stop offset="0%" stopColor="oklch(0.6 0.15 160)" />
                    <stop offset="100%" stopColor="oklch(0.7 0.18 160)" />
                  </linearGradient>
                </defs>
                <XAxis type="number" hide domain={[0, 100]} />
                <YAxis
                  type="category"
                  dataKey="stage"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "oklch(0.6 0 0)", fontSize: 12 }}
                  width={70}
                />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* Conversion Stats */}
          <div className="mt-4 grid grid-cols-4 gap-3">
            {conversionData.map((stage, index) => (
              <div key={stage.stage} className="text-center">
                <p className="text-lg font-bold text-foreground">
                  {stage.value}%
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {stage.stage}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
