import Link from "next/link";

import { Button } from "@/components/ui/button";
import type { DailyAction } from "@/lib/ai/daily-actions";
import type { DashboardRecentLead, DashboardRecentProposal } from "@/lib/dashboard-stats";

function leadHref(leadId: string, clientName: string | undefined): string {
  const q = (clientName ?? "").trim();
  return q ? `/leads?q=${encodeURIComponent(q)}` : "/leads";
}

function titleForAction(
  a: DailyAction,
  leadById: Map<string, DashboardRecentLead>,
  proposalById: Map<string, DashboardRecentProposal>,
): string {
  if (a.type === "improve_proposal" && a.proposalId) {
    const p = proposalById.get(a.proposalId);
    return (p?.title ?? "Proposal draft").slice(0, 56);
  }
  if (a.leadId) {
    const l = leadById.get(a.leadId);
    if (l?.projectTitle?.trim()) return l.projectTitle.trim().slice(0, 56);
    return (l?.client_name ?? "Lead").slice(0, 56);
  }
  return "Today";
}

export function TodayFocusSection({
  actions,
  recentLeads,
  recentProposals,
}: {
  actions: DailyAction[];
  recentLeads: DashboardRecentLead[];
  recentProposals: DashboardRecentProposal[];
}) {
  const leadById = new Map(recentLeads.map((l) => [l.id, l]));
  const proposalById = new Map(recentProposals.map((p) => [p.id, p]));

  if (!actions.length) {
    return (
      <section className="rounded-xl border border-border bg-card/30 px-4 py-3" aria-label="Today focus">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Today</h2>
        <p className="mt-2 text-sm text-muted-foreground">No queued actions — add leads or proposals to populate this list.</p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-border bg-card/30 px-4 py-3" aria-label="Today focus">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Today</h2>
      <ul className="mt-3 space-y-2.5">
        {actions.map((a, i) => {
          const title = titleForAction(a, leadById, proposalById);
          const clientName = a.leadId ? leadById.get(a.leadId)?.projectTitle ?? leadById.get(a.leadId)?.client_name : undefined;
          return (
            <li
              key={`${a.type}-${a.leadId ?? ""}-${a.proposalId ?? ""}-${i}`}
              className="flex flex-col gap-2 rounded-lg border border-border bg-background/50 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">{title}</p>
                <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{a.reason}</p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                {a.leadId ? (
                  <Button variant="outline" size="sm" asChild>
                    <Link href={leadHref(a.leadId, clientName)}>Open lead</Link>
                  </Button>
                ) : null}
                {a.type === "improve_proposal" ? (
                  <Button variant="default" size="sm" asChild>
                    <Link
                      href={
                        a.leadId
                          ? `/proposals?leadId=${encodeURIComponent(a.leadId)}`
                          : "/proposals"
                      }
                    >
                      Open proposals
                    </Link>
                  </Button>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
