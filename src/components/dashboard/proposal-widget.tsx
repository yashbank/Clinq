"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { FileText, Sparkles, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PremiumEmpty } from "@/components/ui/premium-empty";
import type { DashboardRecentProposal } from "@/lib/dashboard-stats";

export function ProposalWidget({ proposals }: { proposals: DashboardRecentProposal[] }) {
  return (
    <div className="glass-card overflow-hidden rounded-2xl border border-clinq-glass-border/60">
      <div className="flex items-center justify-between border-b border-clinq-glass-border px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent">
            <FileText className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Proposals</h3>
            <p className="text-xs text-muted-foreground">Saved from your workspace</p>
          </div>
        </div>
        <Button size="sm" className="gap-2 bg-primary/15 text-primary hover:bg-primary/25" asChild>
          <Link href="/proposals">
            <Sparkles className="h-3.5 w-3.5" />
            Studio
          </Link>
        </Button>
      </div>

      <div className="p-4">
        {proposals.length === 0 ? (
          <PremiumEmpty
            icon={FileText}
            title="No proposals logged"
            description="When you generate and save from Proposal studio, drafts land here for quick access."
            primary={{ label: "Open studio", href: "/proposals" }}
            className="border-dashed border-clinq-glass-border/80 bg-background/30 py-10"
          />
        ) : (
          <ul className="space-y-1">
            {proposals.map((p) => {
              const title = p.title?.trim() || "Proposal";
              const when = formatDistanceToNow(new Date(p.created_at), { addSuffix: true });
              const client = p.lead_client_name;
              return (
                <li key={p.id}>
                  <div className="flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-clinq-glass/40">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted/30">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-foreground">{title}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {client ? `${client} · ` : null}
                        {when}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="border-t border-clinq-glass-border px-4 py-3">
        <Link
          href="/proposals"
          className="flex w-full items-center justify-center gap-2 text-sm font-medium text-primary transition-colors hover:text-primary/85"
        >
          Proposal studio
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
