"use client";

import Link from "next/link";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useDismissedSuggestionIds } from "@/hooks/use-dismissed-suggestions";
import type { WorkflowSuggestion } from "@/lib/automation/workflow-intelligence";
import { cn } from "@/lib/utils";

const RULE_TYPES: { title: string; body: string }[] = [
  {
    title: "Follow-up reminder",
    body: "Store how many days after a touchpoint you want a nudge. Clinq records the rule only — no auto-send.",
  },
  {
    title: "Proposal reminder",
    body: "Plan when to revisit a proposal draft. Execution stays manual until a scheduler ships.",
  },
  {
    title: "Lead priority",
    body: "Flag a minimum score for triage. Used as stored intent; ranking still uses live lead data.",
  },
];

function kindLabel(kind: WorkflowSuggestion["kind"]): string {
  switch (kind) {
    case "draft_proposal":
      return "Draft proposal";
    case "thread_follow_up":
      return "Thread follow-up";
    case "proposal_thread_reminder":
      return "Reminder after proposal";
    case "stale_strong_saved":
      return "Stale strong lead";
    case "saved_sitting":
      return "Saved too long";
    case "missed_high_score":
      return "High score quiet";
    case "review_skipped_scrapes":
      return "Scraped queue";
    case "tighten_proposal":
      return "Proposal quality";
    default:
      return "Suggestion";
  }
}

export function WorkflowIntelligencePanel({ suggestions }: { suggestions: WorkflowSuggestion[] }) {
  const { dismissed, dismiss } = useDismissedSuggestionIds();
  const visible = suggestions.filter((s) => !dismissed.has(s.id));

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-border/80 bg-card/35 p-4 sm:p-5" aria-label="Workflow intelligence">
        <h2 className="text-sm font-semibold text-foreground">What Clinq does today</h2>
        <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted-foreground">
          <li>
            <span className="font-medium text-foreground">Suggest:</span> deterministic queue items from leads, proposals,
            reminders, and your scraped review state — surfaced on Overview and here.
          </li>
          <li>
            <span className="font-medium text-foreground">Store:</span> workflow definitions below (rules you name). Nothing runs on a
            schedule in this release.
          </li>
          <li>
            <span className="font-medium text-foreground">Remind:</span> follow-ups live as your own activity rows — no outbound
            messaging from Clinq.
          </li>
        </ul>
      </section>

      <section className="rounded-2xl border border-border/80 bg-card/35 p-4 sm:p-5" aria-label="Active suggestions">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-sm font-semibold text-foreground">Suggested now</h2>
          <span className="text-[11px] text-muted-foreground">From live workspace data · dismiss hides on this device</span>
        </div>
        {visible.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            {suggestions.length === 0
              ? "Nothing to suggest yet — add leads or process scraped imports."
              : "All current suggestions are dismissed. Clear local site data to reset, or revisit when leads change."}
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {visible.map((s) => (
              <li
                key={s.id}
                className="flex flex-col gap-2 rounded-xl border border-border/60 bg-background/50 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{kindLabel(s.kind)}</p>
                  <p className="mt-0.5 text-sm font-medium text-foreground">{s.title}</p>
                  <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{s.why}</p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={s.href}>Open</Link>
                  </Button>
                  {s.dismissable ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className={cn("h-9 w-9 text-muted-foreground hover:text-foreground")}
                      aria-label="Dismiss suggestion"
                      onClick={() => dismiss(s.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-border/80 bg-card/35 p-4 sm:p-5" aria-label="Available rule types">
        <h2 className="text-sm font-semibold text-foreground">Rule types you can save</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {RULE_TYPES.map((r) => (
            <div key={r.title} className="rounded-xl border border-border/60 bg-background/40 p-3">
              <p className="text-sm font-medium text-foreground">{r.title}</p>
              <p className="mt-1.5 text-xs leading-snug text-muted-foreground">{r.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
