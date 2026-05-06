import Link from "next/link";

import { Sparkles } from "lucide-react";

import type { DashboardPriorityLead } from "@/lib/dashboard-stats";
import type { DashboardSourceBullet } from "@/lib/dashboard-source-signals";
import { PremiumEmpty } from "@/components/ui/premium-empty";
import { cn } from "@/lib/utils";

export function OpportunityCommandCenter({
  leads,
  sourceBullets,
  worthReviewHref,
}: {
  leads: DashboardPriorityLead[];
  sourceBullets: DashboardSourceBullet[];
  worthReviewHref: string;
}) {
  const bullets = sourceBullets.slice(0, 3);

  return (
    <section className="rounded-2xl border border-border/80 bg-card/40 p-3.5 sm:p-5" aria-label="Opportunity command center">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold tracking-tight text-foreground">Best opportunities today</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">Ranked from score, fit, recency, and your recent signals.</p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <Link
            href="/leads?sort=recommended"
            className="inline-flex min-h-10 items-center rounded-md px-1 font-medium text-primary underline-offset-4 hover:underline"
          >
            Recommended leads
          </Link>
          <Link
            href={worthReviewHref}
            className="inline-flex min-h-10 items-center rounded-md px-1 font-medium text-primary underline-offset-4 hover:underline"
          >
            Scraped queue
          </Link>
        </div>
      </div>

      {leads.length === 0 ? (
        <div className="mt-4">
          <PremiumEmpty
            icon={Sparkles}
            title="No ranked opportunities yet"
            description="Once leads are in your workspace, this row highlights the best fits by score, budget, and recency."
            primary={{ label: "Add or import leads", href: "/leads" }}
            secondary={{ label: "Integrations", href: "/integrations" }}
            className="border-border/60 bg-background/20 py-10"
          />
        </div>
      ) : (
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {leads.map((lead) => (
            <li key={lead.id}>
              <Link
                href={lead.href}
                className="flex h-full min-h-[8.5rem] flex-col rounded-xl border border-border/70 bg-background/50 px-3 py-3 transition-colors hover:border-primary/35 hover:bg-muted/20 active:bg-muted/30"
              >
                <span
                  className={cn(
                    "w-fit rounded-md border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                    lead.opportunityLabel.includes("proposal")
                      ? "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400"
                      : lead.opportunityLabel.includes("Strong")
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-400"
                        : lead.opportunityLabel.includes("follow")
                          ? "border-sky-500/40 bg-sky-500/10 text-sky-800 dark:text-sky-300"
                          : lead.opportunityLabel.includes("Stale")
                            ? "border-orange-500/35 bg-orange-500/10 text-orange-800 dark:text-orange-300"
                            : "border-border bg-muted/30 text-muted-foreground",
                  )}
                >
                  {lead.opportunityLabel}
                </span>
                <span className="mt-2 line-clamp-2 text-sm font-medium text-foreground">{lead.title}</span>
                <span className="mt-1 text-[11px] text-muted-foreground">
                  Score {lead.score} · {lead.budgetLabel}
                </span>
                <span className="mt-2 line-clamp-2 text-[11px] leading-snug text-muted-foreground">{lead.opportunityWhy}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {bullets.length > 0 ? (
        <div className="mt-5 border-t border-border/60 pt-4">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Sources</p>
          <ul className="mt-2 space-y-1.5">
            {bullets.map((b) => (
              <li key={b.label}>
                <Link href={b.href} className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
                  <span className="font-medium text-foreground">{b.label}</span>
                  <span className="text-muted-foreground"> — {b.detail}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
