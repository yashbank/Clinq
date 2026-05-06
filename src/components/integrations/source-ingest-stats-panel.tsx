import type { SourceQualityMetrics } from "@/lib/integrations/source-quality-metrics";

function formatSince(iso: string) {
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return iso;
  }
}

function pct(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return `${n}%`;
}

export function SourceIngestStatsPanel({ stats }: { stats: SourceQualityMetrics }) {
  return (
    <section className="rounded-2xl border border-border/70 bg-card/25 px-4 py-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Source quality · last {stats.days} days</h3>
      <p className="mt-1 text-[11px] text-muted-foreground">
        Since {formatSince(stats.sinceIso)} · counts from <code className="rounded bg-muted px-1 py-0.5 font-mono text-[10px]">scraped_leads</code>,{" "}
        <code className="rounded bg-muted px-1 py-0.5 font-mono text-[10px]">leads</code>, and{" "}
        <code className="rounded bg-muted px-1 py-0.5 font-mono text-[10px]">analytics</code> import events only.
      </p>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-left text-[11px]">
          <thead>
            <tr className="border-b border-border/80 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              <th className="py-2 pr-2">Source</th>
              <th className="py-2 pr-2 tabular-nums">Fetched</th>
              <th className="py-2 pr-2 tabular-nums">Dup</th>
              <th className="py-2 pr-2 tabular-nums">Staged</th>
              <th className="py-2 pr-2 tabular-nums">Promoted</th>
              <th className="py-2 pr-2 tabular-nums">Skipped</th>
              <th className="py-2 pr-2 tabular-nums">Rate*</th>
              <th className="py-2 tabular-nums">Avg score†</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50 text-muted-foreground">
            {stats.rows.map((r) => (
              <tr key={r.source}>
                <td className="py-2 pr-2 font-medium capitalize text-foreground">{r.source}</td>
                <td className="py-2 pr-2 tabular-nums">{r.fetched != null ? r.fetched : "—"}</td>
                <td className="py-2 pr-2 tabular-nums">{r.duplicates}</td>
                <td className="py-2 pr-2 tabular-nums">{r.stagedScraped}</td>
                <td className="py-2 pr-2 tabular-nums">{r.promotedScraped}</td>
                <td className="py-2 pr-2 tabular-nums">{r.skippedScraped}</td>
                <td className="py-2 pr-2 tabular-nums">{pct(r.promotionRateFromFetchedPct ?? r.promotionRateFromStagedPct)}</td>
                <td className="py-2 tabular-nums">{r.avgPromotedLeadScore != null ? r.avgPromotedLeadScore : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground">
        *Promotion rate uses fetched rows when import telemetry exists; otherwise staged rows. †Average Clinq score of imported leads created in this window
        (rows with <code className="rounded bg-muted px-1 font-mono">import_external_id</code>).
      </p>
    </section>
  );
}
