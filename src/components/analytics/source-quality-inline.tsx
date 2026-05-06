import Link from "next/link";

import { SourceIngestStatsPanel } from "@/components/integrations/source-ingest-stats-panel";
import type { SourceQualityMetrics } from "@/lib/integrations/source-quality-metrics";

export function SourceQualityInline({ stats }: { stats: SourceQualityMetrics | null }) {
  if (!stats) return null;
  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h2 className="text-lg font-semibold text-foreground">Import sources</h2>
        <Link href="/integrations" className="text-xs font-medium text-primary underline-offset-4 hover:underline">
          Integrations
        </Link>
      </div>
      <SourceIngestStatsPanel stats={stats} />
    </section>
  );
}
