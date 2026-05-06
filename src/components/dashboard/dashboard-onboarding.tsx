"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";

const STORAGE_KEY = "clinq_dash_onboarding_dismiss_v1";

export function DashboardOnboarding({
  show,
  displayName,
}: {
  show: boolean;
  displayName: string | null;
}) {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      setDismissed(false);
    }
  }, []);

  if (!show || dismissed) return null;

  const name = displayName?.split(/\s+/)[0];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-background/60 px-5 py-5 sm:px-6 sm:py-6">
      <button
        type="button"
        onClick={() => {
          try {
            localStorage.setItem(STORAGE_KEY, "1");
          } catch {
            /* ignore */
          }
          setDismissed(true);
        }}
        className="absolute right-3 top-3 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
      <p className="pr-10 text-xs font-medium uppercase tracking-wider text-muted-foreground">Welcome</p>
      <h2 className="mt-1 text-lg font-semibold tracking-tight text-foreground sm:text-xl">
        {name ? `Hi ${name}` : "You’re in"}, let’s keep this workspace real
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        This overview reflects what you save: leads, proposals you log, and pipeline stages. Tune your freelancer profile so scoring and drafts stay aligned with how you work.
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        <Link
          href="/leads"
          className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-95"
        >
          Add a lead
        </Link>
        <Link
          href="/proposals"
          className="inline-flex items-center justify-center rounded-lg border border-border bg-background/80 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted/40"
        >
          Open proposals
        </Link>
        <Link
          href="/pipeline"
          className="inline-flex items-center justify-center rounded-lg border border-border bg-background/80 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted/40"
        >
          View pipeline
        </Link>
        <Link
          href="/profile"
          className="inline-flex items-center justify-center rounded-lg border border-border bg-background/80 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted/40"
        >
          Profile &amp; intelligence
        </Link>
      </div>
    </div>
  );
}
