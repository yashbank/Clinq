"use client";

import { ChevronDown } from "lucide-react";

import type { ProfileIntelligenceV1 } from "@/types/profile-intelligence";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

function ChipList({ items, empty }: { items: string[]; empty: string }) {
  if (!items.length) {
    return <p className="text-sm text-muted-foreground">{empty}</p>;
  }
  return (
    <ul className="flex flex-wrap gap-1.5">
      {items.map((s) => (
        <li
          key={s}
          className="rounded-md border border-clinq-glass-border/60 bg-clinq-glass/25 px-2 py-0.5 text-xs font-medium text-foreground"
        >
          {s}
        </li>
      ))}
    </ul>
  );
}

export function ProfileIntelligencePanel({ intelligence }: { intelligence: ProfileIntelligenceV1 | null }) {
  return (
    <section className="mb-10 space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-foreground">Profile intelligence</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Derived from your saved profile and resume. Use &quot;Refresh intelligence&quot; below after edits.
        </p>
      </div>

      {!intelligence ? (
        <div className="rounded-2xl border border-clinq-glass-border/60 bg-background/30 px-5 py-8 text-sm text-muted-foreground">
          No intelligence blob stored yet. Save your profile, then refresh—Clinq runs a deterministic pass over your
          skills and resume text.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-clinq-glass-border/60 bg-background/30 p-4 sm:p-5">
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Detected skills</p>
            <div className="mt-2">
              <ChipList items={intelligence.normalizedSkills} empty="Add skills or resume text to infer tokens." />
            </div>
          </div>
          <div className="rounded-2xl border border-clinq-glass-border/60 bg-background/30 p-4 sm:p-5">
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Strongest niches</p>
            <div className="mt-2">
              <ChipList items={intelligence.inferredNiches} empty="Set niches on your profile to sharpen this list." />
            </div>
          </div>

          <Collapsible defaultOpen className="group/c0 sm:col-span-2">
            <CollapsibleTrigger className="flex w-full items-center justify-between rounded-xl border border-clinq-glass-border/60 bg-background/30 px-4 py-3 text-left text-sm font-medium text-foreground transition-colors hover:bg-clinq-glass/20">
              Positioning &amp; proposal tone
              <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]/c0:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0">
              <div className="mt-2 space-y-3 rounded-xl border border-clinq-glass-border/50 bg-background/25 p-4 sm:p-5">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Suggested line</p>
                  <p className="mt-1 text-sm leading-relaxed text-foreground">{intelligence.positioningLine}</p>
                </div>
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Proposal tone</p>
                  <p className="mt-1 text-sm text-muted-foreground">{intelligence.proposalToneHint}</p>
                </div>
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Ideal project fit</p>
                  <p className="mt-1 text-sm text-muted-foreground">{intelligence.idealProjectSummary}</p>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Collapsible className="group/c1 sm:col-span-2">
            <CollapsibleTrigger className="flex w-full items-center justify-between rounded-xl border border-clinq-glass-border/60 bg-background/30 px-4 py-3 text-left text-sm font-medium text-foreground transition-colors hover:bg-clinq-glass/20">
              Strengths &amp; signals
              <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]/c1:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-2 grid gap-3 rounded-xl border border-clinq-glass-border/50 bg-background/25 p-4 sm:grid-cols-2 sm:p-5">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Strengths</p>
                  <ul className="mt-2 space-y-2">
                    {intelligence.strengths.map((s, i) => (
                      <li key={i} className="text-sm leading-snug text-muted-foreground">
                        · {s}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Experience hint</p>
                    <p className="mt-1 text-sm text-foreground">{intelligence.seniorityHint ?? "Not enough signals yet."}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Profile depth score</p>
                    <p className="mt-1 text-sm tabular-nums text-foreground">
                      {intelligence.profileQualityScore}
                      <span className="text-muted-foreground"> / 100</span>
                      <span className="ml-2 text-xs text-muted-foreground">(heuristic, from fields filled)</span>
                    </p>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Source: {intelligence.source} · Updated {new Date(intelligence.updatedAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {(intelligence.missingSkillHints?.length ||
            intelligence.proposalPositioningNotes?.length ||
            intelligence.idealClientNotes?.length) ? (
            <Collapsible className="group/c2 sm:col-span-2">
              <CollapsibleTrigger className="flex w-full items-center justify-between rounded-xl border border-clinq-glass-border/60 bg-background/30 px-4 py-3 text-left text-sm font-medium text-foreground transition-colors hover:bg-clinq-glass/20">
                Client fit &amp; gaps
                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]/c2:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-2 space-y-4 rounded-xl border border-clinq-glass-border/50 bg-background/25 p-4 sm:p-5">
                  {intelligence.missingSkillHints?.length ? (
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Skill alignment</p>
                      <ul className="mt-2 space-y-1.5 text-xs text-muted-foreground">
                        {intelligence.missingSkillHints.map((t, i) => (
                          <li key={i}>· {t}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {intelligence.proposalPositioningNotes?.length ? (
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Proposal angle</p>
                      <ul className="mt-2 space-y-1.5 text-xs text-muted-foreground">
                        {intelligence.proposalPositioningNotes.map((t, i) => (
                          <li key={i}>· {t}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {intelligence.idealClientNotes?.length ? (
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Ideal client sketch</p>
                      <ul className="mt-2 space-y-1.5 text-xs text-muted-foreground">
                        {intelligence.idealClientNotes.map((t, i) => (
                          <li key={i}>· {t}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              </CollapsibleContent>
            </Collapsible>
          ) : null}
        </div>
      )}
    </section>
  );
}
