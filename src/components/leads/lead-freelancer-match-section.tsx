"use client";

import { AlertTriangle, Briefcase, LineChart, Sparkles, Wrench } from "lucide-react";

import { computeLeadFreelancerMatch } from "@/lib/leads/lead-freelancer-match";
import type { LeadRow } from "@/types/database";

export type FreelancerMatchContext = {
  skills: string[];
  niches: string[];
  techStack: string[];
};

export function LeadFreelancerMatchSection({
  row,
  freelancer,
}: {
  row: LeadRow;
  freelancer: FreelancerMatchContext | null;
}) {
  if (!freelancer || (freelancer.skills.length === 0 && freelancer.niches.length === 0 && freelancer.techStack.length === 0)) {
    return (
      <div className="border-b border-clinq-glass-border p-5">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Sparkles className="h-4 w-4 text-primary" />
          Fit vs your profile
        </div>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          Add skills or niches under Profile to see keyword overlap and brief-aligned hints for this lead.
        </p>
      </div>
    );
  }

  const m = computeLeadFreelancerMatch(row, freelancer);
  const risks = m.warnings.filter((w) => w.toLowerCase().startsWith("risk:"));
  const signals = m.warnings.filter((w) => !w.toLowerCase().startsWith("risk:"));

  return (
    <div className="border-b border-clinq-glass-border p-5">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <Sparkles className="h-4 w-4 text-primary" />
        Fit vs your profile
      </div>
      <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
        Heuristic read of your saved skills vs this brief—not a prediction of outcomes.
      </p>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <Metric icon={Wrench} label="Skill overlap" value={`${m.skillMatchPct}%`} />
        <Metric icon={Briefcase} label="Portfolio alignment" value={`${m.portfolioAlignmentPct}%`} />
        <Metric icon={LineChart} label="Proposal leverage" value={`${m.proposalStrengthHint}/100`} />
      </div>

      <div className="mt-4 space-y-2">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Why it lines up</p>
        <ul className="space-y-1.5">
          {m.whyMatch.map((t, i) => (
            <li key={i} className="flex gap-2 text-xs leading-relaxed text-muted-foreground">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary/80" />
              {t}
            </li>
          ))}
        </ul>
      </div>

      {m.skillReasons.length > 0 ? (
        <div className="mt-4 space-y-1.5">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Skill signals</p>
          <ul className="space-y-1">
            {m.skillReasons.map((t, i) => (
              <li key={i} className="text-xs text-muted-foreground">
                {t}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {risks.length > 0 ? (
        <div className="mt-4 rounded-xl border border-destructive/25 bg-destructive/[0.06] p-3">
          <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-destructive">
            <AlertTriangle className="h-3.5 w-3.5" />
            Watch
          </p>
          <ul className="mt-2 space-y-1">
            {risks.map((t, i) => (
              <li key={i} className="text-xs leading-snug text-destructive/90">
                {t.replace(/^risk:\s*/i, "")}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {signals.length > 0 ? (
        <div className="mt-3 space-y-1">
          {signals.map((t, i) => (
            <p key={i} className="text-[11px] text-muted-foreground">
              {t}
            </p>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof Wrench; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-clinq-glass-border/50 bg-clinq-glass/20 px-2.5 py-2.5 text-center">
      <Icon className="mx-auto h-3.5 w-3.5 text-primary opacity-90" />
      <p className="mt-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-semibold tabular-nums text-foreground">{value}</p>
    </div>
  );
}
