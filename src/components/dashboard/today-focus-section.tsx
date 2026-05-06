"use client";

import Link from "next/link";
import { ListTodo } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PremiumEmpty } from "@/components/ui/premium-empty";
import type { DailyAction } from "@/lib/ai/daily-actions";
import type { DashboardRecentLead, DashboardRecentProposal } from "@/lib/dashboard-stats";
import { useDismissedSuggestionIds } from "@/hooks/use-dismissed-suggestions";
import { cn } from "@/lib/utils";

function leadHref(leadId: string, clientName: string | undefined): string {
  const q = (clientName ?? "").trim();
  return q ? `/leads?q=${encodeURIComponent(q)}` : "/leads";
}

function fallbackTitle(
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
  return "Action";
}

function formatSuggestionKind(k: DailyAction["suggestionKind"]): string {
  switch (k) {
    case "draft_proposal":
      return "Draft proposal";
    case "thread_follow_up":
      return "Thread follow-up";
    case "proposal_thread_reminder":
      return "Follow-up after proposal";
    case "stale_strong_saved":
      return "Stale strong lead";
    case "saved_sitting":
      return "Saved too long";
    case "missed_high_score":
      return "High score · quiet";
    case "review_skipped_scrapes":
      return "Scraped imports";
    case "tighten_proposal":
      return "Proposal quality";
    default:
      return "Suggestion";
  }
}

function primaryCtaLabel(a: DailyAction): string {
  if (a.type === "scraped_queue") return "Review queue";
  if (a.type === "improve_proposal") return "Open proposals";
  if (a.type === "follow_up" && a.actionHref.startsWith("/follow-ups")) return "Reminders";
  if (a.type === "follow_up") return "Open lead";
  if (a.type === "missed_opportunity") return "Open";
  return "Open";
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
  const { dismissed, dismiss } = useDismissedSuggestionIds();

  const visible = actions.filter((a) => !dismissed.has(a.suggestionId));

  if (!actions.length) {
    return (
      <section aria-label="Today focus">
        <PremiumEmpty
          icon={ListTodo}
          title="Action queue is quiet"
          description="Save leads, log proposals, or run an import — suggestions appear here from your real workspace data."
          primary={{ label: "Leads", href: "/leads" }}
          secondary={{ label: "Integrations", href: "/integrations" }}
          className="border-border/70 bg-card/25 py-10 sm:py-12"
        />
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-border bg-card/30 px-3 py-3 sm:px-4" aria-label="Today focus">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Action queue</h2>
        <span className="text-[10px] text-muted-foreground">Dismiss hides on this device only</span>
      </div>
      {visible.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Everything here is dismissed on this device.{" "}
          <Link href="/leads" className="font-medium text-primary underline-offset-4 hover:underline">
            Open Leads
          </Link>{" "}
          to keep working, or revisit tomorrow.
        </p>
      ) : (
        <ul className="mt-3 space-y-2.5">
          {visible.map((a, i) => {
            const title = (a.headline?.trim() || fallbackTitle(a, leadById, proposalById)).slice(0, 72);
            const clientName = a.leadId ? leadById.get(a.leadId)?.projectTitle ?? leadById.get(a.leadId)?.client_name : undefined;
            const secondaryHref = a.leadId ? leadHref(a.leadId, clientName) : null;
            return (
              <li
                key={`${a.suggestionId}-${i}`}
                className="flex flex-col gap-2 rounded-lg border border-border bg-background/50 px-3 py-2.5 sm:flex-row sm:items-stretch sm:justify-between sm:gap-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    {formatSuggestionKind(a.suggestionKind)}
                  </p>
                  <p className="text-sm font-medium text-foreground">{title}</p>
                  <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{a.reason}</p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2 sm:flex-col sm:items-stretch sm:justify-center">
                  <Button variant="default" size="sm" className="min-h-10 sm:min-h-9" asChild>
                    <Link href={a.actionHref}>{primaryCtaLabel(a)}</Link>
                  </Button>
                  {secondaryHref && a.actionHref !== secondaryHref ? (
                    <Button variant="outline" size="sm" className="min-h-10 sm:min-h-9" asChild>
                      <Link href={secondaryHref}>Lead</Link>
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className={cn("min-h-10 text-muted-foreground hover:text-foreground sm:min-h-8")}
                    onClick={() => dismiss(a.suggestionId)}
                  >
                    Dismiss
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
