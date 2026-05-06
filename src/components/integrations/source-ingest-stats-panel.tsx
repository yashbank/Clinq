import type { SourceIngestStats } from "@/lib/integrations/source-ingest-stats";

function formatSince(iso: string) {
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return iso;
  }
}

export function SourceIngestStatsPanel({ stats }: { stats: SourceIngestStats }) {
  const scrapedEntries = Object.entries(stats.scrapedBySource).sort(([a], [b]) => a.localeCompare(b));
  const leadEntries = Object.entries(stats.leadsByImportProvider).sort(([a], [b]) => a.localeCompare(b));

  return (
    <section className="rounded-2xl border border-border/70 bg-card/25 px-4 py-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Source activity (last 14 days)</h3>
      <p className="mt-1 text-[11px] text-muted-foreground">Since {formatSince(stats.sinceIso)} · from your workspace rows only</p>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-[11px] font-medium text-foreground">Scraped staging</p>
          <ul className="mt-1.5 space-y-1 text-[11px] text-muted-foreground">
            {scrapedEntries.length === 0 ? <li>—</li> : null}
            {scrapedEntries.map(([src, v]) => (
              <li key={src}>
                <span className="font-medium text-foreground">{src}</span>: {v.total} rows · {v.promoted} promoted · {v.skipped} skipped/other
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-[11px] font-medium text-foreground">Leads by import provider</p>
          <ul className="mt-1.5 space-y-1 text-[11px] text-muted-foreground">
            {leadEntries.length === 0 ? <li>—</li> : null}
            {leadEntries.map(([prov, n]) => (
              <li key={prov}>
                <span className="font-medium text-foreground">{prov}</span>: {n}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
