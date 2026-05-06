"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BarChart3 } from "lucide-react";

import { PremiumEmpty } from "@/components/ui/premium-empty";

import type { AnalyticsSnapshot } from "@/lib/analytics/aggregate";
import type { SourceQualityMetrics } from "@/lib/integrations/source-quality-metrics";
import { SourceQualityInline } from "@/components/analytics/source-quality-inline";
function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-xl border border-border/70 bg-background/40 p-4 sm:p-5">
      <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight text-foreground">{value}</p>
      <p className="mt-1.5 text-xs leading-snug text-muted-foreground">{hint}</p>
    </div>
  );
}

const chartTick = { fill: "oklch(0.55 0 0)", fontSize: 11 };

const PIPELINE_COLORS = [
  "oklch(0.7 0.15 200)",
  "oklch(0.65 0.2 180)",
  "oklch(0.75 0.18 160)",
  "oklch(0.6 0.15 220)",
  "oklch(0.8 0.12 140)",
  "oklch(0.62 0.12 200)",
];

export function AnalyticsDashboard({ data, sourceQuality }: { data: AnalyticsSnapshot; sourceQuality?: SourceQualityMetrics | null }) {
  const empty = data.totals.leads === 0 && data.totals.proposals === 0;

  const pipelineChart = data.pipelineByStage.map((s) => ({ name: s.label, count: s.count }));
  const platformChart = data.platformBreakdown.slice(0, 8).map((p) => ({ name: p.label, count: p.count }));
  const scoreChart = data.scoreDistribution.map((s) => ({ name: s.band, count: s.count }));
  const manualCount = data.sourceOriginSplit.find((s) => s.label === "Manual entry")?.count ?? 0;
  const importedCount = data.sourceOriginSplit.find((s) => s.label === "Imported")?.count ?? 0;

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-16">
      <header className="space-y-2">
        <h2 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">Workspace signals</h2>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Every figure is computed from your Supabase leads and proposals only—no sample or projected series.
        </p>
      </header>

      {empty ? (
        <PremiumEmpty
          icon={BarChart3}
          title="Charts need data first"
          description="Once you have leads and logged proposals, funnel mix, reply proxy, and pace tiles fill in automatically."
          primary={{ label: "Open Leads", href: "/leads" }}
          secondary={{ label: "Proposal studio", href: "/proposals" }}
          className="border-border/70 bg-background/30 py-14"
        />
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Stat
          label="Lead quality (avg score)"
          value={String(data.avgLeadScore)}
          hint={`${data.pctHighQuality}% of leads at 75+ score.`}
        />
        <Stat
          label="Reply progression"
          value={data.replyProgressPct == null ? "—" : `${data.replyProgressPct}%`}
          hint="Among leads past Saved: share at Replied or later (pipeline proxy, not inbox telemetry)."
        />
        <Stat
          label="Proposals linked to leads"
          value={data.proposalLinkedPct == null ? "—" : `${data.proposalLinkedPct}%`}
          hint="Logged proposals that include a lead reference."
        />
        <Stat
          label="Pipeline completion"
          value={data.completionRatePct == null ? "—" : `${data.completionRatePct}%`}
          hint={`${data.totals.completedLeads} completed of ${data.totals.leads} leads.`}
        />
        <Stat label="Total leads" value={String(data.totals.leads)} hint="Rows in your leads table." />
        <Stat label="Total proposals" value={String(data.totals.proposals)} hint="Rows in your proposals table." />
      </div>

      {!empty ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Stat
            label="Proposal pace (30d)"
            value={String(data.proposalsLast30d)}
            hint={`Compared to prior 30 days (${data.proposalsPrev30d} proposals with recorded dates).`}
          />
          <Stat
            label="Open follow-up reminders"
            value={String(data.openFollowUpReminders)}
            hint="Follow-up activities not marked done — your backlog for nudges."
          />
          <Stat
            label="Pipeline stage updates (28d)"
            value={String(data.pipelineStageChanges28d)}
            hint="Count of stage_changed activities in the trend window."
          />
          <Stat
            label="Manual vs imported leads"
            value={`${manualCount} / ${importedCount}`}
            hint="Imported = import_external_id in metadata; manual is the remainder."
          />
          <Stat
            label="Completed + proposal link"
            value={data.completedWithProposalPct == null ? "—" : `${data.completedWithProposalPct}%`}
            hint="Completed leads with at least one linked proposal."
          />
        </div>
      ) : null}

      {!empty ? (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-border/70 bg-background/40 p-4 sm:p-5">
            <h2 className="text-sm font-semibold text-foreground">Pipeline distribution</h2>
            <p className="mt-1 text-xs text-muted-foreground">Counts by stage for all leads.</p>
            <div className="mt-4 h-[240px] w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pipelineChart} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.22 0.02 280 / 0.35)" vertical={false} />
                  <XAxis dataKey="name" tick={chartTick} axisLine={false} tickLine={false} interval={0} angle={-18} textAnchor="end" height={56} />
                  <YAxis tick={chartTick} axisLine={false} tickLine={false} width={36} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "10px",
                      border: "1px solid oklch(0.28 0.02 280 / 0.45)",
                      background: "oklch(0.12 0.01 280 / 0.96)",
                      fontSize: "12px",
                    }}
                    labelStyle={{ color: "oklch(0.75 0 0)" }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={44}>
                    {pipelineChart.map((_, i) => (
                      <Cell key={i} fill={PIPELINE_COLORS[i % PIPELINE_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-border/70 bg-background/40 p-4 sm:p-5">
            <h2 className="text-sm font-semibold text-foreground">Platform / source</h2>
            <p className="mt-1 text-xs text-muted-foreground">Grouped by platform field or lead source metadata.</p>
            <div className="mt-4 h-[240px] w-full min-w-0">
              {platformChart.length === 0 ? (
                <p className="py-12 text-center text-sm text-muted-foreground">No source labels on leads yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart layout="vertical" data={platformChart} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.22 0.02 280 / 0.35)" horizontal={false} />
                    <XAxis type="number" tick={chartTick} axisLine={false} tickLine={false} allowDecimals={false} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={100}
                      tick={chartTick}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "10px",
                        border: "1px solid oklch(0.28 0.02 280 / 0.45)",
                        background: "oklch(0.12 0.01 280 / 0.96)",
                        fontSize: "12px",
                      }}
                    />
                    <Bar dataKey="count" radius={[0, 6, 6, 0]} fill="oklch(0.65 0.2 180)" maxBarSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-border/70 bg-background/40 p-4 sm:p-5">
            <h2 className="text-sm font-semibold text-foreground">Score distribution</h2>
            <p className="mt-1 text-xs text-muted-foreground">Buckets from your lead scores only.</p>
            <div className="mt-4 h-[220px] w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={scoreChart} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.22 0.02 280 / 0.35)" vertical={false} />
                  <XAxis dataKey="name" tick={chartTick} axisLine={false} tickLine={false} interval={0} />
                  <YAxis tick={chartTick} axisLine={false} tickLine={false} width={32} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "10px",
                      border: "1px solid oklch(0.28 0.02 280 / 0.45)",
                      background: "oklch(0.12 0.01 280 / 0.96)",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} fill="oklch(0.72 0.14 200)" maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ) : null}

      {sourceQuality ? <SourceQualityInline stats={sourceQuality} /> : null}
    </div>
  );
}
