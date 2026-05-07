"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Github, Loader2, Radio } from "lucide-react";

import { clearGithubImportPatAction, saveGithubImportPatAction } from "@/actions/github-import-pat";
import { runPublicSourceIngestAction, type PublicIngestResult } from "@/actions/public-source-ingest";
import { publicIngestToastDescription } from "@/lib/integrations/public-ingest-result-copy";
import type { PublicIngestSourceId } from "@/lib/leads/sources/registry";
import { publicIngestCapForSource } from "@/lib/integrations/source-batch-caps";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function toastResult(res: PublicIngestResult) {
  toast.message(`${res.source}: import finished`, {
    description: publicIngestToastDescription(res),
    duration: res.errors.length ? 10_000 : 6500,
  });
}

type HubFlags = {
  redditOAuthServerConfigured: boolean;
  githubUserPatConfigured: boolean;
  githubServerTokenConfigured: boolean;
};

export function PublicIngestForms({ hubFlags }: { hubFlags: HubFlags }) {
  const redditCap = publicIngestCapForSource("reddit", {
    redditOAuthConfigured: hubFlags.redditOAuthServerConfigured,
    githubHasElevatedToken: false,
  });
  const githubCap = publicIngestCapForSource("github", {
    redditOAuthConfigured: false,
    githubHasElevatedToken: hubFlags.githubUserPatConfigured || hubFlags.githubServerTokenConfigured,
  });

  return (
    <section className="rounded-2xl border border-border/70 bg-card/30 p-5">
      <h2 className="text-base font-semibold text-foreground">GitHub &amp; Reddit discovery</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Official APIs only. Rows are staged in <span className="font-medium text-foreground">Scraped leads</span>, scored, then promoted when
        relevance clears the threshold.
      </p>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <RedditIngestCard capSummary={redditCap.summary} disabled={redditCap.disabled} />
        <GitHubIngestCard
          capSummary={githubCap.summary}
          maxPerRun={githubCap.maxPerRun}
          patConfigured={hubFlags.githubUserPatConfigured}
          serverTokenConfigured={hubFlags.githubServerTokenConfigured}
        />
      </div>
    </section>
  );
}

function RedditIngestCard({ capSummary, disabled }: { capSummary: string; disabled: boolean }) {
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
    if (disabled) {
      toast.message("Reddit import is not enabled here", {
        description:
          "Add REDDIT_OAUTH_ACCESS_TOKEN on the server, then refresh Integrations. Until then, runs stay disabled so results stay predictable.",
        duration: 9000,
      });
      return;
    }
    start(() => {
      void (async () => {
        const res = await runPublicSourceIngestAction("reddit", { query, limit });
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
        "flex flex-col rounded-2xl border bg-background/50 p-5 transition-colors",
        disabled ? "border-orange-500/20 opacity-90" : "border-orange-500/15",
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-300">
          <Radio className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-foreground">Reddit</h3>
            <span
              className={cn(
                "shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium",
                disabled ? "bg-muted text-muted-foreground" : "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300",
              )}
            >
              {disabled ? "Setup required" : "API ready"}
            </span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{capSummary}</p>
          {disabled ? (
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Set <code className="rounded bg-muted px-1 py-0.5 font-mono text-[10px]">REDDIT_OAUTH_ACCESS_TOKEN</code> in the server
              environment (script/app OAuth token with access to search). Anonymous JSON search is not supported.
            </p>
          ) : (
            <p className="mt-2 text-xs text-muted-foreground">Uses Reddit&apos;s official OAuth search endpoint only.</p>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1">
          <label className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Query</label>
          <input
            value={q}
            disabled={disabled || pending}
            onChange={(e) => setQ(e.target.value)}
            placeholder="e.g. hire react developer remote"
            className="mt-1 w-full rounded-lg border border-border bg-background/80 px-3 py-2 text-sm text-foreground outline-none ring-primary/25 focus:ring-2 disabled:opacity-60"
          />
        </div>
        <div className="w-full sm:w-24">
          <label className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Limit</label>
          <input
            type="number"
            min={1}
            max={25}
            value={limit}
            disabled={disabled || pending}
            onChange={(e) => setLimit(Math.min(25, Math.max(1, Number(e.target.value) || 12)))}
            className="mt-1 w-full rounded-lg border border-border bg-background/80 px-2 py-2 text-sm tabular-nums text-foreground outline-none ring-primary/25 focus:ring-2 disabled:opacity-60"
          />
        </div>
        <Button type="button" size="sm" disabled={pending || disabled} onClick={run} className="h-9 shrink-0 gap-2">
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          Fetch
        </Button>
      </div>
    </div>
  );
}

function GitHubIngestCard({
  capSummary,
  maxPerRun,
  patConfigured,
  serverTokenConfigured,
}: {
  capSummary: string;
  maxPerRun: number;
  patConfigured: boolean;
  serverTokenConfigured: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [patPending, patStart] = useTransition();
  const [q, setQ] = useState("");
  const [limit, setLimit] = useState(Math.min(12, maxPerRun));
  const [patInput, setPatInput] = useState("");

  const run = () => {
    const query = q.trim();
    if (!query) {
      toast.error("Enter a search query");
      return;
    }
    start(() => {
      void (async () => {
        const res = await runPublicSourceIngestAction("github" as PublicIngestSourceId, {
          query,
          limit: Math.min(maxPerRun, limit),
        });
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

  const savePat = () => {
    const raw = patInput.trim();
    if (!raw) {
      toast.error("Paste a token first");
      return;
    }
    patStart(() => {
      void (async () => {
        const res = await saveGithubImportPatAction(raw);
        if (!res.ok) {
          toast.error(res.error);
          return;
        }
        setPatInput("");
        toast.success("GitHub token saved server-side");
        router.refresh();
      })();
    });
  };

  const clearPat = () => {
    patStart(() => {
      void (async () => {
        const res = await clearGithubImportPatAction();
        if (!res.ok) {
          toast.error(res.error);
          return;
        }
        toast.message("GitHub token removed");
        router.refresh();
      })();
    });
  };

  return (
    <div className="flex flex-col rounded-2xl border border-slate-500/15 bg-background/50 p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-500/10 text-slate-700 dark:text-slate-200">
          <Github className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-foreground">GitHub</h3>
            <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary">
              {patConfigured || serverTokenConfigured ? "Elevated limits" : "Public limits"}
            </span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{capSummary}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            Optional fine-grained PAT stays on the server; it is never shown back after you save it.
            {serverTokenConfigured ? " This deployment also has GITHUB_PUBLIC_IMPORT_TOKEN for shared quota." : null}
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-2 rounded-xl border border-border/60 bg-muted/10 p-3">
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">GitHub token (optional)</p>
        <input
          type="password"
          autoComplete="off"
          value={patInput}
          disabled={patPending}
          onChange={(e) => setPatInput(e.target.value)}
          placeholder={patConfigured ? "Enter a new token to replace the saved one" : "github_pat_… or ghp_…"}
          className="w-full rounded-lg border border-border bg-background/90 px-3 py-2 text-xs text-foreground outline-none ring-primary/20 focus:ring-2"
        />
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="secondary" disabled={patPending} onClick={savePat} className="h-8 text-xs">
            {patPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            Save token
          </Button>
          {patConfigured ? (
            <Button type="button" size="sm" variant="outline" disabled={patPending} onClick={clearPat} className="h-8 text-xs">
              Remove token
            </Button>
          ) : null}
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1">
          <label className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Query</label>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="e.g. next.js dashboard"
            disabled={pending}
            className="mt-1 w-full rounded-lg border border-border bg-background/80 px-3 py-2 text-sm text-foreground outline-none ring-primary/25 focus:ring-2 disabled:opacity-60"
          />
        </div>
        <div className="w-full sm:w-24">
          <label className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Limit</label>
          <input
            type="number"
            min={1}
            max={maxPerRun}
            value={limit}
            disabled={pending}
            onChange={(e) => setLimit(Math.min(maxPerRun, Math.max(1, Number(e.target.value) || 1)))}
            className="mt-1 w-full rounded-lg border border-border bg-background/80 px-2 py-2 text-sm tabular-nums text-foreground outline-none ring-primary/25 focus:ring-2 disabled:opacity-60"
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
