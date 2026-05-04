"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plug2, Unplug } from "lucide-react";

import { setIntegrationStatusAction } from "@/actions/integrations";
import { INTEGRATION_PROVIDERS } from "@/lib/integrations/registry";
import { cn } from "@/lib/utils";
import type { IntegrationAccountRow, IntegrationProviderId } from "@/types/integrations";

export function IntegrationHub({ initialAccounts }: { initialAccounts: IntegrationAccountRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState<IntegrationProviderId | null>(null);

  const statusByProvider = useMemo(() => {
    const m = new Map<IntegrationProviderId, IntegrationAccountRow["status"]>();
    for (const r of initialAccounts) {
      m.set(r.provider, r.status);
    }
    return m;
  }, [initialAccounts]);

  const run = (provider: IntegrationProviderId, status: "connected" | "disconnected") => {
    setBusy(provider);
    startTransition(() => {
      void (async () => {
        const res = await setIntegrationStatusAction(provider, status);
        setBusy(null);
        if (!res.ok) {
          toast.error(res.error);
          return;
        }
        const def = INTEGRATION_PROVIDERS.find((p) => p.id === provider);
        if (status === "connected") {
          toast.success(`${def?.label ?? provider} connected successfully`, {
            description: "Secure link is simulated for now—no jobs are imported yet.",
          });
        } else {
          toast.message(`${def?.label ?? provider} disconnected`);
        }
        router.refresh();
      })();
    });
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <header className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Phase 2</p>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Integrations</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Connect marketplaces to prepare Clinq for imports and bid context. Today this only records your intent—no
          scraping, scripts, or credential storage beyond a simulated link flag.
        </p>
        <Link href="/profile" className="inline-block text-sm font-medium text-primary hover:underline">
          Enrich your freelancer profile →
        </Link>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {INTEGRATION_PROVIDERS.map((p) => {
          const connected = statusByProvider.get(p.id) === "connected";
          const loading = pending && busy === p.id;
          return (
            <div
              key={p.id}
              className={cn(
                "flex flex-col rounded-2xl border bg-background/50 p-5 transition-colors",
                connected ? "border-primary/30 shadow-sm shadow-primary/5" : "border-clinq-glass-border/80",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-foreground">{p.label}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.description}</p>
                  <p className="mt-3 font-mono text-[10px] text-muted-foreground/80">module: {p.moduleKey}</p>
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium",
                    connected ? "bg-primary/15 text-primary" : "bg-muted/40 text-muted-foreground",
                  )}
                >
                  {connected ? "Connected" : "Disconnected"}
                </span>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                {!connected ? (
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => run(p.id, "connected")}
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-95 disabled:opacity-60"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plug2 className="h-4 w-4" />}
                    Connect
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => run(p.id, "disconnected")}
                    className="inline-flex items-center gap-2 rounded-lg border border-clinq-glass-border bg-background/80 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted/30 disabled:opacity-60"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Unplug className="h-4 w-4" />}
                    Disconnect
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
