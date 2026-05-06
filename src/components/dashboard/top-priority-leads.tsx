import Link from "next/link";

import type { DashboardPriorityLead } from "@/lib/dashboard-stats";

export function TopPriorityLeads({ leads }: { leads: DashboardPriorityLead[] }) {
  if (!leads.length) {
    return (
      <section className="rounded-xl border border-border bg-card/30 px-3 py-3 sm:px-4" aria-label="Top priority leads">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Apply first</h2>
        <p className="mt-2 text-sm text-muted-foreground">Add or import leads to see priority-ranked opportunities.</p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-border bg-card/30 px-3 py-3 sm:px-4" aria-label="Top priority leads">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Apply first</h2>
        <Link
          href="/leads?sort=recommended"
          className="inline-flex min-h-9 items-center text-xs font-medium text-primary hover:underline"
        >
          View recommended
        </Link>
      </div>
      <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {leads.map((lead) => (
          <li key={lead.id}>
            <Link
              href={lead.href}
              className="flex h-full min-h-[7.5rem] flex-col rounded-lg border border-border bg-background/60 px-3 py-3 transition-colors hover:bg-accent/25 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 active:bg-accent/35"
            >
              <span className="line-clamp-2 text-sm font-medium text-foreground">{lead.title}</span>
              <span className="mt-1 text-xs text-muted-foreground">
                {lead.budgetLabel} · score {lead.score} · priority {lead.priorityScore}
              </span>
              <span className="mt-2 line-clamp-2 text-xs leading-snug text-muted-foreground">{lead.reason}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
