import Link from "next/link";

import type { DashboardInsights } from "@/lib/dashboard-stats";

function InsightColumn({
  title,
  lines,
  empty,
}: {
  title: string;
  lines: { title: string; subtitle: string; href: string }[];
  empty: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card/40 px-4 py-3 shadow-sm">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3>
      <ul className="mt-3 space-y-2.5">
        {lines.length === 0 ? (
          <li className="text-sm leading-relaxed text-muted-foreground">
            {empty}{" "}
            <Link href="/leads" className="font-medium text-primary underline-offset-4 hover:underline">
              Leads
            </Link>
          </li>
        ) : (
          lines.map((line, i) => (
            <li key={`${line.href}-${i}`}>
              <Link
                href={line.href}
                className="block rounded-md px-1 py-0.5 text-left transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
              >
                <span className="block text-sm font-medium text-foreground">{line.title}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">{line.subtitle}</span>
              </Link>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

export function DashboardInsightsStrip({ insights }: { insights: DashboardInsights }) {
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Lead and proposal insights">
      <InsightColumn
        title="Top leads to apply"
        lines={insights.topApply}
        empty="No strong-score leads yet — save a few on Leads."
      />
      <InsightColumn title="High score (80+)" lines={insights.highScore} empty="Nothing in the 80+ band recently." />
      <InsightColumn
        title="Weak proposals"
        lines={insights.weakProposals}
        empty="No low-scoring drafts in the window — good."
      />
      <InsightColumn
        title="Suggestions"
        lines={insights.suggestions}
        empty="Caught up. New imports or drafts will show here."
      />
    </section>
  );
}
