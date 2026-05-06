import Link from "next/link";

import type { DashboardPriorityLead } from "@/lib/dashboard-stats";

function formatUsd(n: number | null) {
  if (n == null || Number.isNaN(Number(n))) return "—";
  const v = Number(n);
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1000) return `$${(v / 1000).toFixed(1)}k`;
  if (v > 0) return `$${Math.round(v).toLocaleString()}`;
  return "—";
}

export function TopPriorityLeads({ leads }: { leads: DashboardPriorityLead[] }) {
  if (!leads.length) {
    return (
      <section className="rounded-xl border border-border bg-card/30 px-4 py-3" aria-label="Top priority leads">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Apply first</h2>
        <p className="mt-2 text-sm text-muted-foreground">Add or import leads to see priority-ranked opportunities.</p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-border bg-card/30 px-4 py-3" aria-label="Top priority leads">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Apply first</h2>
        <Link href="/leads?sort=recommended" className="text-xs font-medium text-primary hover:underline">
          View recommended
        </Link>
      </div>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {leads.map((lead) => (
          <li key={lead.id}>
            <Link
              href={lead.href}
              className="flex h-full flex-col rounded-lg border border-border bg-background/60 px-3 py-2.5 transition-colors hover:bg-accent/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
            >
              <span className="line-clamp-2 text-sm font-medium text-foreground">{lead.title}</span>
              <span className="mt-1 text-xs text-muted-foreground">
                {formatUsd(lead.budget)} · score {lead.score} · priority {lead.priorityScore}
              </span>
              <span className="mt-2 line-clamp-2 text-xs leading-snug text-muted-foreground">{lead.reason}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
