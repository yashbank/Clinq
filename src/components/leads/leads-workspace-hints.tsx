import Link from "next/link";
import { ArrowUpRight, UserCircle2, Plug } from "lucide-react";

/**
 * Replaces placeholder “insights” tiles with honest workflow CTAs (BRD Phase 2).
 */
export function LeadsWorkspaceHints() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Link
        href="/profile"
        className="group flex items-center justify-between rounded-xl border border-clinq-glass-border/70 bg-background/40 px-4 py-3.5 transition-colors hover:border-primary/25 hover:bg-clinq-glass/30"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <UserCircle2 className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Freelancer profile</p>
            <p className="text-xs text-muted-foreground">Skills & resume improve AI scoring and proposals</p>
          </div>
        </div>
        <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </Link>
      <Link
        href="/integrations"
        className="group flex items-center justify-between rounded-xl border border-clinq-glass-border/70 bg-background/40 px-4 py-3.5 transition-colors hover:border-primary/25 hover:bg-clinq-glass/30"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Plug className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Integrations</p>
            <p className="text-xs text-muted-foreground">Link platforms—imports ship in a later module</p>
          </div>
        </div>
        <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </Link>
    </div>
  );
}
