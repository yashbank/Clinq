"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Gauge } from "lucide-react";

import type { ProposalEvaluationRecord } from "@/lib/ai/evaluators/proposal-quality";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

function band(n: number): { label: string; className: string } {
  if (n >= 78) return { label: "Strong", className: "text-clinq-success" };
  if (n >= 58) return { label: "Solid", className: "text-primary" };
  if (n >= 40) return { label: "Mixed", className: "text-clinq-warning" };
  return { label: "Thin", className: "text-muted-foreground" };
}

function ScoreRow({ label, value }: { label: string; value: number }) {
  const b = band(value);
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className={cn("font-medium tabular-nums", b.className)}>
          {value} · {b.label}
        </span>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-muted/40">
        <div
          className="h-full rounded-full bg-primary/70 transition-[width] duration-500 ease-out"
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    </div>
  );
}

export function ProposalQualityPanel({ evaluation }: { evaluation: ProposalEvaluationRecord }) {
  const [open, setOpen] = useState(false);
  const overallBand = useMemo(() => band(evaluation.overall), [evaluation.overall]);

  const improvements = evaluation.improvements ?? [];
  const why = evaluation.whyItWorks ?? [];
  const weak = evaluation.weakPoints ?? [];
  const trust = evaluation.trustSignalsIncluded ?? [];

  return (
    <div className="rounded-xl border border-clinq-glass-border/70 bg-background/40 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/12">
          <Gauge className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-foreground">Proposal quality</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            Model-scored against your RFP and profile context—not a guarantee of client response.
          </p>
          <p className="mt-2 text-sm font-semibold tabular-nums text-foreground">
            Overall {evaluation.overall}
            <span className={cn("ml-2 text-xs font-medium", overallBand.className)}>{overallBand.label}</span>
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <ScoreRow label="Personalization" value={evaluation.personalization} />
        <ScoreRow label="Relevance" value={evaluation.relevance} />
        <ScoreRow label="Clarity" value={evaluation.clarity} />
        <ScoreRow label="Trust" value={evaluation.trust} />
        <div className="sm:col-span-2">
          <ScoreRow label="CTA quality" value={evaluation.ctaStrength} />
        </div>
      </div>

      {evaluation.strengthSummary ? (
        <p className="mt-4 text-xs leading-relaxed text-muted-foreground">{evaluation.strengthSummary}</p>
      ) : null}

      {evaluation.scoringConfidenceNote ? (
        <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground/90">{evaluation.scoringConfidenceNote}</p>
      ) : null}

      <Collapsible open={open} onOpenChange={setOpen} className="group/pq mt-4">
        <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border border-clinq-glass-border/60 bg-clinq-glass/20 px-3 py-2 text-left text-xs font-medium text-foreground transition-colors hover:bg-clinq-glass/35">
          Reasoning &amp; actions
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform group-data-[state=open]/pq:rotate-180" />
        </CollapsibleTrigger>
        <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0">
          <div className="mt-2 space-y-4 rounded-lg border border-clinq-glass-border/50 bg-background/30 p-3 text-xs">
            {why.length > 0 ? (
              <div>
                <p className="font-medium text-foreground">Why it works</p>
                <ul className="mt-1.5 space-y-1 text-muted-foreground">
                  {why.map((t, i) => (
                    <li key={i}>· {t}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {weak.length > 0 ? (
              <div>
                <p className="font-medium text-foreground">Possible weak points</p>
                <ul className="mt-1.5 space-y-1 text-muted-foreground">
                  {weak.map((t, i) => (
                    <li key={i}>· {t}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {trust.length > 0 ? (
              <div>
                <p className="font-medium text-foreground">Trust signals reflected</p>
                <ul className="mt-1.5 space-y-1 text-muted-foreground">
                  {trust.map((t, i) => (
                    <li key={i}>· {t}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {improvements.length > 0 ? (
              <div>
                <p className="font-medium text-foreground">Try next</p>
                <ul className="mt-1.5 space-y-1 text-muted-foreground">
                  {improvements.map((t, i) => (
                    <li key={i}>· {t}</li>
                  ))}
                </ul>
              </div>
            ) : evaluation.notes.length ? (
              <div>
                <p className="font-medium text-foreground">Notes</p>
                <ul className="mt-1.5 space-y-1 text-muted-foreground">
                  {evaluation.notes.map((t, i) => (
                    <li key={i}>· {t}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
