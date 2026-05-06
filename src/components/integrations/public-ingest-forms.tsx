"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Radio, Github, type LucideIcon } from "lucide-react";

import { runPublicSourceIngestAction, type PublicIngestResult } from "@/actions/public-source-ingest";
import type { PublicIngestSourceId } from "@/lib/leads/sources/registry";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function toastResult(res: PublicIngestResult) {
  toast.message(`${res.source}: staged ${res.scraped_staged_count}, promoted ${res.promoted_count}`, {
    description: `Fetched ${res.fetched_count} · dup ${res.duplicate_count} · invalid ${res.skipped_invalid_count} · skipped ${res.skipped_irrelevant_count}`,
  });
}

function IngestForm({ source, label, icon: Icon }: { source: PublicIngestSourceId; label: string; icon: LucideIcon }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [q, setQ] = useState("");
  const [limit, setLimit] = useState(12);

  const run = () => {
    const query = q.trim();
    if (!query) {
      toast.error("Enter a search query");
      return;
    }
    start(() => {
      void (async () => {
        const res = await runPublicSourceIngestAction(source, { query, limit });
        if (!res.ok) {
          toast.error(res.error);
          return;
        }
        toastResult(res);
        setQ("");
        router.refresh();
      })();
    });
  };

  return (
    <div
      className={cn(
        "rounded-2xl border border-border/80 bg-background/50 p-4",
        source === "reddit" ? "border-orange-500/15" : "border-slate-500/15",
      )}
    >
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold text-foreground">{label}</h3>
      </div>
      <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
        Public search only — rows land in <span className="font-medium text-foreground">Scraped leads</span> first, then relevance scoring may promote them.
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1">
          <label className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Query</label>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={source === "reddit" ? "e.g. hire react developer" : "e.g. react freelance is:issue"}
            className="mt-1 w-full rounded-lg border border-border bg-background/80 px-3 py-2 text-sm text-foreground outline-none ring-primary/25 focus:ring-2"
          />
        </div>
        <div className="w-full sm:w-20">
          <label className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Limit</label>
          <input
            type="number"
            min={1}
            max={25}
            value={limit}
            onChange={(e) => setLimit(Math.min(25, Math.max(1, Number(e.target.value) || 12)))}
            className="mt-1 w-full rounded-lg border border-border bg-background/80 px-2 py-2 text-sm tabular-nums text-foreground outline-none ring-primary/25 focus:ring-2"
          />
        </div>
        <Button type="button" size="sm" disabled={pending} onClick={run} className="h-9 shrink-0 gap-2">
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          Fetch
        </Button>
      </div>
    </div>
  );
}

export function PublicIngestForms() {
  return (
    <section className="rounded-2xl border border-border/70 bg-card/30 p-5">
      <h2 className="text-base font-semibold text-foreground">Public discovery feeds</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Reddit JSON search and GitHub public issue search — no credentials required (optional{" "}
        <code className="rounded bg-muted px-1 py-0.5 font-mono text-[10px]">GITHUB_PUBLIC_IMPORT_TOKEN</code> raises GitHub rate limits).
      </p>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <IngestForm source="reddit" label="Reddit" icon={Radio} />
        <IngestForm source="github" label="GitHub" icon={Github} />
      </div>
    </section>
  );
}
