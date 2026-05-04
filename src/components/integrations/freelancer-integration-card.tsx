"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Download, Loader2, Plug2, RefreshCw, Unplug } from "lucide-react";

import { retryFreelancerImportJobAction, runFreelancerLeadImportAction } from "@/actions/freelancer-import";
import { setIntegrationStatusAction } from "@/actions/integrations";
import { IntegrationPlatformMark } from "@/components/integrations/integration-platform-mark";
import { INTEGRATION_PROVIDERS } from "@/lib/integrations/registry";
import { cn } from "@/lib/utils";
import type { IntegrationAccountRow, IntegrationProviderId } from "@/types/integrations";

export type FreelancerImportJobSummary = {
  id: string;
  status: string;
  job_type: string | null;
  payload: Record<string, unknown> | null;
  result: Record<string, unknown> | null;
  error: string | null;
  scheduled_at: string;
  completed_at: string | null;
};

type Props = {
  account: IntegrationAccountRow | undefined;
  jobs: FreelancerImportJobSummary[];
  oauthConfigured: boolean;
  importRuntimeReady: boolean;
};

export function FreelancerIntegrationCard({ account, jobs, oauthConfigured, importRuntimeReady }: Props) {
  const def = INTEGRATION_PROVIDERS.find((p) => p.id === "freelancer")!;
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(15);

  const connected = account?.status === "connected";

  useEffect(() => {
    const err = searchParams.get("freelancer_error");
    const ok = searchParams.get("freelancer");
    if (err) {
      toast.error(decodeURIComponent(err));
      router.replace("/integrations");
    } else if (ok === "connected") {
      toast.success("Freelancer connected", {
        description: "You can import a batch of active listings. API rate limits still apply on Freelancer’s side.",
      });
      router.replace("/integrations");
    }
  }, [searchParams, router]);

  const lastSummary = useMemo(() => {
    const j = jobs[0];
    if (!j?.result || typeof j.result !== "object") return null;
    return j.result as Record<string, unknown>;
  }, [jobs]);

  const disconnect = () => {
    setBusy(true);
    startTransition(() => {
      void (async () => {
        const res = await setIntegrationStatusAction("freelancer" as IntegrationProviderId, "disconnected");
        setBusy(false);
        if (!res.ok) {
          toast.error(res.error);
          return;
        }
        toast.message("Freelancer disconnected", { description: "OAuth tokens were removed from Clinq." });
        router.refresh();
      })();
    });
  };

  const runImport = () => {
    setBusy(true);
    startTransition(() => {
      void (async () => {
        const res = await runFreelancerLeadImportAction({ query: query.trim() || undefined, limit });
        setBusy(false);
        if (!res.ok) {
          toast.error(res.error);
          return;
        }
        toast.success("Import finished", {
          description: `Imported ${res.imported}, skipped duplicates ${res.duplicates}, failed ${res.failed}.`,
        });
        router.refresh();
      })();
    });
  };

  const retryJob = (jobId: string) => {
    setBusy(true);
    startTransition(() => {
      void (async () => {
        const res = await retryFreelancerImportJobAction(jobId);
        setBusy(false);
        if (!res.ok) {
          toast.error(res.error);
          return;
        }
        toast.success("Retry finished", {
          description: `Imported ${res.imported}, duplicates ${res.duplicates}, failed ${res.failed}.`,
        });
        router.refresh();
      })();
    });
  };

  return (
    <div
      className={cn(
        "flex flex-col rounded-2xl border bg-background/50 p-5 transition-colors sm:col-span-2",
        connected ? "border-primary/25" : "border-clinq-glass-border/80",
      )}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <IntegrationPlatformMark id={def.id} initial={def.initial} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-semibold text-foreground">{def.label}</h2>
              <span
                className={cn(
                  "shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium",
                  connected ? "bg-primary/12 text-primary" : "bg-muted/40 text-muted-foreground",
                )}
              >
                {connected ? "Connected" : "Disconnected"}
              </span>
            </div>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Official Freelancer.com REST API only (OAuth2, documented project endpoints). Imports are real marketplace
              listings—not simulated data. Batches are capped to stay within rate limits; scoring runs automatically after each
              insert.
            </p>
            {!oauthConfigured ? (
              <p className="mt-2 text-xs text-muted-foreground">
                Set <code className="rounded bg-muted px-1 py-0.5 font-mono text-[10px]">FREELANCER_CLIENT_ID</code> and{" "}
                <code className="rounded bg-muted px-1 py-0.5 font-mono text-[10px]">FREELANCER_CLIENT_SECRET</code> on the
                server, register the redirect URL{" "}
                <code className="rounded bg-muted px-1 py-0.5 font-mono text-[10px]">…/api/integrations/freelancer/callback</code>{" "}
                in the Freelancer developer app, and restart Clinq.
              </p>
            ) : null}
            {oauthConfigured && !importRuntimeReady ? (
              <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                Add <code className="rounded bg-muted px-1 py-0.5 font-mono text-[10px]">SUPABASE_SERVICE_ROLE_KEY</code> so
                Clinq can store OAuth tokens outside the browser session.
              </p>
            ) : null}
            {account?.last_sync_at ? (
              <p className="mt-2 text-[11px] text-muted-foreground">
                Last activity · {new Date(account.last_sync_at).toLocaleString()}
                {account.sync_status && account.sync_status !== "idle" ? ` · ${account.sync_status}` : null}
              </p>
            ) : null}
            {lastSummary && typeof lastSummary.imported === "number" ? (
              <p className="mt-1 text-[11px] text-muted-foreground">
                Last batch: {String(lastSummary.imported)} new · {String(lastSummary.duplicates ?? 0)} duplicates ·{" "}
                {String(lastSummary.failed ?? 0)} failed
              </p>
            ) : null}
            <p className="mt-2 font-mono text-[10px] text-muted-foreground/70">module · freelancer.v1</p>
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col">
          {!connected ? (
            oauthConfigured && importRuntimeReady ? (
              <a
                href="/api/integrations/freelancer/authorize"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-95"
              >
                <Plug2 className="h-4 w-4" />
                Connect with Freelancer
              </a>
            ) : (
              <button
                type="button"
                disabled
                className="inline-flex cursor-not-allowed items-center justify-center gap-2 rounded-lg border border-clinq-glass-border bg-muted/20 px-4 py-2 text-sm font-medium text-muted-foreground"
              >
                <Plug2 className="h-4 w-4" />
                Connect (configure env)
              </button>
            )
          ) : (
            <button
              type="button"
              disabled={busy || pending}
              onClick={disconnect}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-clinq-glass-border bg-background/80 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted/30 disabled:opacity-60"
            >
              {busy || pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Unplug className="h-4 w-4" />}
              Disconnect
            </button>
          )}
        </div>
      </div>

      {connected && oauthConfigured && importRuntimeReady ? (
        <div className="mt-6 space-y-4 border-t border-clinq-glass-border/60 pt-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1">
              <label className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Search query</label>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. react, figma, mobile app"
                className="mt-1 w-full rounded-lg border border-clinq-glass-border bg-background/80 px-3 py-2 text-sm text-foreground outline-none ring-primary/30 focus:ring-2"
              />
            </div>
            <div className="w-full sm:w-28">
              <label className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Batch size</label>
              <input
                type="number"
                min={1}
                max={30}
                value={limit}
                onChange={(e) => setLimit(Math.min(30, Math.max(1, Number(e.target.value) || 15)))}
                className="mt-1 w-full rounded-lg border border-clinq-glass-border bg-background/80 px-3 py-2 text-sm tabular-nums text-foreground outline-none ring-primary/30 focus:ring-2"
              />
            </div>
            <button
              type="button"
              disabled={busy || pending}
              onClick={runImport}
              className="inline-flex h-[42px] shrink-0 items-center justify-center gap-2 self-end rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-95 disabled:opacity-60"
            >
              {busy || pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Import batch
            </button>
          </div>
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Each run fetches up to your batch size from <span className="font-medium text-foreground">projects/active</span>,
            skips leads you already imported, then runs Clinq scoring on new rows. This is not background magic—expect network
            latency and occasional API errors.
          </p>

          {jobs.length > 0 ? (
            <div className="rounded-xl border border-clinq-glass-border/70 bg-background/40">
              <div className="border-b border-clinq-glass-border/50 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Import history
              </div>
              <ul className="max-h-48 divide-y divide-clinq-glass-border/40 overflow-y-auto text-xs">
                {jobs.map((j) => (
                  <li key={j.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                    <div className="min-w-0">
                      <span className="font-medium text-foreground">{j.status}</span>
                      <span className="ml-2 text-muted-foreground">{new Date(j.scheduled_at).toLocaleString()}</span>
                      {j.error ? <p className="mt-0.5 truncate text-destructive">{j.error}</p> : null}
                    </div>
                    {j.status === "failed" ? (
                      <button
                        type="button"
                        disabled={busy || pending}
                        onClick={() => retryJob(j.id)}
                        className="inline-flex shrink-0 items-center gap-1 rounded-md border border-clinq-glass-border px-2 py-1 text-[11px] font-medium text-foreground hover:bg-muted/30 disabled:opacity-50"
                      >
                        <RefreshCw className="h-3 w-3" />
                        Retry
                      </button>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}

      <p className="mt-4 text-[11px] text-muted-foreground">
        More sources (Fiverr, Contra, CSV) share the same ingestion architecture—this module is the first live provider.{" "}
        <Link href="/leads" className="font-medium text-primary underline-offset-4 hover:underline">
          View leads
        </Link>
      </p>
    </div>
  );
}
