"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Download, KeyRound, Loader2, Plug2, RefreshCw, Unplug } from "lucide-react";

import { connectFreelancerPersonalTokenAction, validateFreelancerPersonalTokenAction } from "@/actions/freelancer-personal-token";
import {
  retryFreelancerImportJobAction,
  runFreelancerLeadImportAction,
  type FreelancerImportSuccess,
} from "@/actions/freelancer-import";
import { setIntegrationStatusAction } from "@/actions/integrations";
import { IntegrationPlatformMark } from "@/components/integrations/integration-platform-mark";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FREELANCER_IMPORT_DEFAULT, FREELANCER_IMPORT_MAX } from "@/lib/integrations/source-batch-caps";
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

function connectionKindFromMeta(meta: Record<string, unknown> | undefined): "oauth2" | "personal_token" | null {
  const k = meta?.connection_kind;
  return k === "oauth2" || k === "personal_token" ? k : null;
}

function num(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function showImportResultToasts(res: FreelancerImportSuccess) {
  const errTail = res.errors.length ? ` ${res.errors.slice(0, 2).join("; ")}` : "";
  if (res.fetched_count === 0) {
    toast.info("No listings matched this query from Freelancer", {
      description: "Try different keywords or increase batch size.",
    });
    return;
  }
  if (res.promoted_count === 0) {
    toast.message("Listings were fetched but filtered out as low relevance", {
      description: `Fetched ${res.fetched_count}, staged ${res.scraped_staged_count}, promoted 0. Skipped (irrelevant): ${res.skipped_irrelevant_count}. Duplicates: ${res.duplicate_count}. Failed: ${res.failed_count}.${errTail}`.trim(),
    });
    return;
  }
  toast.success("Import finished", {
    description: `Fetched ${res.fetched_count} · Promoted ${res.promoted_count} · Skipped irrelevant ${res.skipped_irrelevant_count} · Duplicates ${res.duplicate_count} · Failed ${res.failed_count}${errTail}`.trim(),
  });
}

type Props = {
  account: IntegrationAccountRow | undefined;
  jobs: FreelancerImportJobSummary[];
  oauthConfigured: boolean;
  /** Service role present — token vault + imports (OAuth and/or personal token). */
  importRuntimeReady: boolean;
};

export function FreelancerIntegrationCard({ account, jobs, oauthConfigured, importRuntimeReady }: Props) {
  const def = INTEGRATION_PROVIDERS.find((p) => p.id === "freelancer")!;
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(FREELANCER_IMPORT_DEFAULT);

  const [patOpen, setPatOpen] = useState(false);
  const [patToken, setPatToken] = useState("");
  const [patAction, setPatAction] = useState<null | "validate" | "save">(null);

  const connected = account?.status === "connected";
  const meta = account?.meta && typeof account.meta === "object" && !Array.isArray(account.meta) ? (account.meta as Record<string, unknown>) : undefined;
  const connectionKind = connectionKindFromMeta(meta);

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
        toast.message("Freelancer disconnected", { description: "Credentials were removed from Clinq." });
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
        showImportResultToasts(res);
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
        showImportResultToasts(res);
        router.refresh();
      })();
    });
  };

  const validatePat = () => {
    if (!patToken.trim()) {
      toast.error("Paste your token first");
      return;
    }
    setPatAction("validate");
    startTransition(() => {
      void (async () => {
        const res = await validateFreelancerPersonalTokenAction(patToken);
        setPatAction(null);
        if (!res.ok) {
          toast.error(res.error);
          return;
        }
        toast.success("Token is valid", { description: "You can save it to connect." });
      })();
    });
  };

  const savePat = () => {
    if (!patToken.trim()) {
      toast.error("Paste your token first");
      return;
    }
    setPatAction("save");
    startTransition(() => {
      void (async () => {
        const res = await connectFreelancerPersonalTokenAction(patToken);
        setPatAction(null);
        if (!res.ok) {
          toast.error(res.error);
          return;
        }
        setPatToken("");
        setPatOpen(false);
        toast.success("Freelancer connected", {
          description: "Personal token saved. You can import when ready.",
        });
        router.refresh();
      })();
    });
  };

  return (
    <div
      className={cn(
        "flex flex-col rounded-2xl border bg-background/50 p-5 transition-colors sm:col-span-2",
        connected ? "border-primary/25" : "border-border/80",
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
              {connected && connectionKind === "personal_token" ? (
                <span className="shrink-0 rounded-full bg-muted/50 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  Personal token
                </span>
              ) : null}
              {connected && connectionKind === "oauth2" ? (
                <span className="shrink-0 rounded-full bg-muted/50 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  OAuth
                </span>
              ) : null}
            </div>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Official Freelancer.com REST API only (OAuth2 or personal access token, documented endpoints). Imports are real
              marketplace listings—not simulated data. Each run fetches up to {FREELANCER_IMPORT_MAX} active listings (default{" "}
              {FREELANCER_IMPORT_DEFAULT}) with conservative batching; scoring runs automatically after each insert.
            </p>
            {!oauthConfigured ? (
              <p className="mt-2 text-xs text-muted-foreground">
                OAuth app not configured on the server — use{" "}
                <span className="font-medium text-foreground">Connect with Personal Token</span> if you have a PAT, or set{" "}
                <code className="rounded bg-muted px-1 py-0.5 font-mono text-[10px]">FREELANCER_CLIENT_ID</code> /{" "}
                <code className="rounded bg-muted px-1 py-0.5 font-mono text-[10px]">FREELANCER_CLIENT_SECRET</code> for OAuth
                when your app is approved.
              </p>
            ) : null}
            {oauthConfigured && !importRuntimeReady ? (
              <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                Add <code className="rounded bg-muted px-1 py-0.5 font-mono text-[10px]">SUPABASE_SERVICE_ROLE_KEY</code> so
                Clinq can store tokens outside the browser session.
              </p>
            ) : null}
            {account?.last_sync_at ? (
              <p className="mt-2 text-[11px] text-muted-foreground">
                Last activity · {new Date(account.last_sync_at).toLocaleString()}
                {account.sync_status && account.sync_status !== "idle" ? ` · ${account.sync_status}` : null}
              </p>
            ) : null}
            {lastSummary ? (
              <p className="mt-1 text-[11px] text-muted-foreground">
                Last batch: fetched {num(lastSummary.fetched_count) ?? num(lastSummary.projectCount) ?? "—"} · promoted{" "}
                {num(lastSummary.promoted_count) ?? num(lastSummary.imported) ?? "—"} · skipped irrelevant{" "}
                {num(lastSummary.skipped_irrelevant_count) ?? "—"} · duplicates {num(lastSummary.duplicate_count) ?? num(lastSummary.duplicates) ?? "—"} · failed{" "}
                {num(lastSummary.failed_count) ?? num(lastSummary.failed) ?? "—"}
                {typeof lastSummary.query === "string" && lastSummary.query.trim() ? ` · query “${lastSummary.query.trim()}”` : ""}
              </p>
            ) : null}
            <p className="mt-1 text-[11px]">
              <Link href="/integrations/scraped" className="font-medium text-primary underline-offset-4 hover:underline">
                Review scraped leads
              </Link>
            </p>
            <p className="mt-2 font-mono text-[10px] text-muted-foreground/70">module · freelancer.v1</p>
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col">
          {!connected ? (
            importRuntimeReady ? (
              <div className="flex flex-col gap-2 sm:items-end">
                {oauthConfigured ? (
                  <a
                    href="/api/integrations/freelancer/authorize"
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-95"
                  >
                    <Plug2 className="h-4 w-4" />
                    Connect with Freelancer
                  </a>
                ) : null}
                <Button
                  type="button"
                  variant={oauthConfigured ? "outline" : "default"}
                  className={cn(
                    "inline-flex items-center justify-center gap-2",
                    !oauthConfigured && "bg-primary text-primary-foreground hover:bg-primary/90",
                  )}
                  onClick={() => setPatOpen(true)}
                >
                  <KeyRound className="h-4 w-4" />
                  Connect with Personal Token
                </Button>
              </div>
            ) : (
              <button
                type="button"
                disabled
                className="inline-flex cursor-not-allowed items-center justify-center gap-2 rounded-lg border border-border bg-muted/20 px-4 py-2 text-sm font-medium text-muted-foreground"
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
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-background/80 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted/30 disabled:opacity-60"
            >
              {busy || pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Unplug className="h-4 w-4" />}
              Disconnect
            </button>
          )}
        </div>
      </div>

      {connected && importRuntimeReady ? (
        <div className="mt-6 space-y-4 border-t border-border/60 pt-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1">
              <label className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Search query</label>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. react, figma, mobile app"
                className="mt-1 w-full rounded-lg border border-border bg-background/80 px-3 py-2 text-sm text-foreground outline-none ring-primary/30 focus:ring-2"
              />
            </div>
            <div className="w-full sm:w-28">
              <label className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Batch size</label>
              <input
                type="number"
                min={1}
                max={FREELANCER_IMPORT_MAX}
                value={limit}
                onChange={(e) =>
                  setLimit(Math.min(FREELANCER_IMPORT_MAX, Math.max(1, Number(e.target.value) || FREELANCER_IMPORT_DEFAULT)))
                }
                className="mt-1 w-full rounded-lg border border-border bg-background/80 px-3 py-2 text-sm tabular-nums text-foreground outline-none ring-primary/30 focus:ring-2"
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
            <div className="rounded-xl border border-border/70 bg-background/40">
              <div className="border-b border-border/50 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Import history
              </div>
              <ul className="max-h-48 divide-y divide-border/40 overflow-y-auto text-xs">
                {jobs.map((j) => {
                  const res = j.result && typeof j.result === "object" ? (j.result as Record<string, unknown>) : null;
                  const dup = num(res?.duplicate_count) ?? num(res?.duplicates);
                  const promoted = num(res?.promoted_count) ?? num(res?.imported);
                  const fetched = num(res?.fetched_count) ?? num(res?.projectCount);
                  const skippedIrr = num(res?.skipped_irrelevant_count);
                  const fail = num(res?.failed_count) ?? num(res?.failed);
                  const q = res && typeof res.query === "string" ? res.query.trim() : "";
                  return (
                    <li key={j.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-foreground">{j.status}</span>
                          <span className="text-muted-foreground">{new Date(j.scheduled_at).toLocaleString()}</span>
                        </div>
                        {fetched != null || promoted != null || dup != null || fail != null || skippedIrr != null ? (
                          <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">
                            {fetched != null ? <span className="mr-2">Fetched: {fetched}</span> : null}
                            {promoted != null ? <span className="mr-2">Promoted: {promoted}</span> : null}
                            {skippedIrr != null ? <span className="mr-2">Skip irr.: {skippedIrr}</span> : null}
                            {dup != null ? <span className="mr-2">Dup: {dup}</span> : null}
                            {fail != null ? <span>Fail: {fail}</span> : null}
                            {q ? <span className="mt-0.5 block truncate" title={q}>{`Query: ${q}`}</span> : null}
                          </p>
                        ) : null}
                        {j.error ? (
                          <p className="mt-1 line-clamp-3 text-[11px] leading-snug text-destructive" title={j.error}>
                            {j.error}
                          </p>
                        ) : null}
                      </div>
                      {j.status === "failed" ? (
                        <button
                          type="button"
                          disabled={busy || pending}
                          onClick={() => retryJob(j.id)}
                          className="inline-flex shrink-0 items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] font-medium text-foreground hover:bg-muted/30 disabled:opacity-50"
                        >
                          <RefreshCw className="h-3 w-3" />
                          Retry
                        </button>
                      ) : null}
                    </li>
                  );
                })}
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

      <Dialog
        open={patOpen}
        onOpenChange={(o) => {
          setPatOpen(o);
          if (!o) {
            setPatToken("");
            setPatAction(null);
          }
        }}
      >
        <DialogContent className="max-w-md border-border bg-background/95 backdrop-blur-md">
          <DialogHeader>
            <DialogTitle>Freelancer personal access token</DialogTitle>
            <DialogDescription>
              Temporary fallback while OAuth app approval is pending. Create a token in your Freelancer developer account, paste
              it once here, then validate before saving.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <div className="space-y-2">
              <Label htmlFor="freelancer-pat">Token</Label>
              <Textarea
                id="freelancer-pat"
                name="freelancer-pat"
                autoComplete="off"
                rows={4}
                placeholder="Paste token only in this dialog…"
                value={patToken}
                onChange={(e) => setPatToken(e.target.value)}
                className="font-mono text-xs"
              />
            </div>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              Token is encrypted and stored server-side only. It is never returned to your browser after you connect.
            </p>
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" disabled={patAction !== null} onClick={() => setPatOpen(false)}>
              Cancel
            </Button>
            <Button type="button" variant="secondary" disabled={patAction !== null} onClick={validatePat} className="gap-2">
              {patAction === "validate" ? <Loader2 className="h-4 w-4 shrink-0 animate-spin" /> : null}
              Validate token
            </Button>
            <Button type="button" disabled={patAction !== null} onClick={savePat} className="gap-2">
              {patAction === "save" ? <Loader2 className="h-4 w-4 shrink-0 animate-spin" /> : null}
              Save &amp; connect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
