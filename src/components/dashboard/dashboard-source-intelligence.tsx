import Link from "next/link";

import type { DashboardSourceSignals } from "@/lib/dashboard-source-signals";

export function DashboardSourceIntelligence({ signals }: { signals: DashboardSourceSignals | null }) {
  if (!signals || signals.bullets.length === 0) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-border/70 bg-card/30 p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-foreground">Sources & actions</h2>
        <Link href="/integrations/scraped" className="text-xs font-medium text-primary underline-offset-4 hover:underline">
          Review scraped
        </Link>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">Last 7 days from your import rows and staging queue.</p>
      <ul className="mt-3 space-y-2.5 text-sm">
        {signals.bullets.map((b) => (
          <li key={b.label}>
            <Link href={b.href} className="block rounded-lg border border-border/60 bg-background/40 px-3 py-2 transition-colors hover:bg-muted/30">
              <span className="font-medium text-foreground">{b.label}</span>
              <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">{b.detail}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
