"use client";

import Link from "next/link";
import { useTransition } from "react";
import { toast } from "sonner";
import {
  MoreHorizontal,
  Target,
  ThumbsUp,
  ThumbsDown,
  Archive,
  Trash2,
  Briefcase,
  Clock,
  ExternalLink,
} from "lucide-react";

import { archiveLeadAction, softDeleteLeadAction, updateLeadInterestAction } from "@/actions/leads";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { Lead } from "@/types/leads-ui";

interface AdvancedLeadsTableProps {
  leads: Lead[];
  selectedLead: string | null;
  onSelectLead: (id: string | null) => void;
  onAddLead?: () => void;
  onLeadMutated?: () => void;
  total?: number;
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

function getScoreColor(score: number) {
  if (score >= 85) return "text-clinq-success";
  if (score >= 70) return "text-primary";
  if (score >= 50) return "text-clinq-warning";
  return "text-destructive";
}

export function AdvancedLeadsTable({
  leads,
  selectedLead,
  onSelectLead,
  onAddLead,
  onLeadMutated,
  total,
  page = 1,
  totalPages = 1,
  onPageChange,
}: AdvancedLeadsTableProps) {
  const [pending, startTransition] = useTransition();

  const runInterest = (leadId: string, status: "interested" | "not_interested" | null) => {
    startTransition(() => {
      void (async () => {
        const res = await updateLeadInterestAction(leadId, status);
        if (!res.ok) {
          toast.error(res.error);
          return;
        }
        toast.message(
          status === "interested" ? "Marked interested" : status === "not_interested" ? "Marked not interested" : "Cleared interest",
        );
        onLeadMutated?.();
      })();
    });
  };

  const runArchive = (leadId: string) => {
    startTransition(() => {
      void (async () => {
        const res = await archiveLeadAction(leadId, true);
        if (!res.ok) {
          toast.error(res.error);
          return;
        }
        toast.success("Lead archived");
        onLeadMutated?.();
      })();
    });
  };

  const runDelete = (leadId: string) => {
    startTransition(() => {
      void (async () => {
        const res = await softDeleteLeadAction(leadId);
        if (!res.ok) {
          toast.error(res.error);
          return;
        }
        toast.message("Lead removed", { description: "Hidden from lists." });
        onLeadMutated?.();
      })();
    });
  };

  const highCount = leads.filter((l) => l.aiScore >= 80).length;

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card/40 shadow-sm transition-shadow duration-200">
      <div className="flex flex-col gap-1 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-accent/20">
            <Target className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Leads</h3>
            <p className="text-xs text-muted-foreground">
              {highCount > 0 ? (
                <>
                  <span className="font-medium text-clinq-success">High potential (80%+): {highCount}</span> on this page
                </>
              ) : (
                "Scores and matches from your saved opportunities"
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="-mx-0 overflow-x-auto px-0 sm:mx-0">
        <table className="w-full min-w-[800px] table-fixed">
          <thead>
            <tr className="border-b border-border bg-muted/30 text-left text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              <th className="px-3 py-2.5 sm:px-4">Project</th>
              <th className="hidden w-[100px] px-2 py-2.5 sm:table-cell">Platform</th>
              <th className="hidden px-3 py-2.5 md:table-cell lg:w-[32%]">Summary</th>
              <th className="w-[72px] px-2 py-2.5 text-center sm:w-[88px]">Score</th>
              <th className="hidden w-[120px] px-2 py-2.5 sm:table-cell">Budget</th>
              <th className="w-10 px-1 py-2.5 text-center sm:w-11" aria-label="Listing" />
              <th className="w-[120px] px-2 py-2.5 text-right sm:w-[150px]">Proposal</th>
              <th className="w-12 px-1 py-2.5 text-right" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border/80">
            {leads.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-16 text-center">
                  <div className="mx-auto flex max-w-sm flex-col items-center gap-3">
                    <Target className="h-8 w-8 text-primary" />
                    <p className="text-sm font-medium text-foreground">No leads yet</p>
                    <p className="text-sm text-muted-foreground">Import from Freelancer or add a lead manually.</p>
                    {onAddLead ? (
                      <Button type="button" onClick={onAddLead} className="bg-primary text-primary-foreground">
                        Add lead
                      </Button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ) : null}
            {leads.map((lead) => (
              <tr
                key={lead.id}
                onClick={() => onSelectLead(lead.id)}
                className={cn(
                  "cursor-pointer transition-colors",
                  selectedLead === lead.id ? "bg-primary/5" : "hover:bg-muted/30",
                  lead.aiScore >= 80 && "bg-clinq-success/5",
                )}
              >
                <td className="px-3 py-2.5 sm:px-4 sm:py-3">
                  <p className="line-clamp-2 font-medium text-foreground">{lead.projectTitle || lead.name}</p>
                </td>
                <td className="hidden px-2 py-2.5 sm:table-cell sm:py-3">
                  {lead.sourceChannel === "freelancer" ? (
                    <span className="inline-flex rounded border border-primary/25 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                      Freelancer
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </td>
                <td className="hidden px-3 py-2.5 text-sm text-muted-foreground md:table-cell md:py-3">
                  <p className="line-clamp-2 leading-snug">{lead.shortSummary || "—"}</p>
                </td>
                <td className="px-2 py-2.5 text-center align-middle sm:py-3">
                  <span
                    className={cn(
                      "inline-flex min-w-[2.25rem] items-center justify-center rounded-md border border-border/60 px-1.5 py-0.5 text-lg font-bold tabular-nums",
                      getScoreColor(lead.aiScore),
                    )}
                  >
                    {lead.aiScore}
                  </span>
                </td>
                <td className="hidden px-2 py-2.5 sm:table-cell sm:py-3">
                  {lead.budgetLine ? (
                    <span className="inline-flex items-center gap-1.5 text-sm text-foreground">
                      {lead.budgetKind === "hourly" ? (
                        <Clock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
                      ) : lead.budgetKind === "fixed" ? (
                        <Briefcase className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
                      ) : null}
                      <span className="tabular-nums">{lead.budgetLine}</span>
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-1 py-2.5 text-center align-middle sm:py-3" onClick={(e) => e.stopPropagation()}>
                  {lead.listingUrl ? (
                    <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-muted-foreground hover:text-primary" asChild>
                      <a href={lead.listingUrl} target="_blank" rel="noopener noreferrer" title="Open original listing" aria-label="Open original listing">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-2 py-2.5 text-right align-middle sm:py-3" onClick={(e) => e.stopPropagation()}>
                  <Button variant="secondary" size="sm" className="text-xs" asChild>
                    <Link href={`/proposals?leadId=${encodeURIComponent(lead.id)}`}>Generate proposal</Link>
                  </Button>
                </td>
                <td className="px-1 py-2.5 text-right align-middle sm:py-3" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={pending}
                        className="text-muted-foreground"
                        aria-label="Lead actions"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="min-w-[12rem] border-border bg-popover text-foreground">
                      <DropdownMenuItem className="gap-2" onClick={() => runInterest(lead.id, "interested")}>
                        <ThumbsUp className="h-4 w-4" /> Interested
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2" onClick={() => runInterest(lead.id, "not_interested")}>
                        <ThumbsDown className="h-4 w-4" /> Not interested
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2" onClick={() => runInterest(lead.id, null)}>
                        Clear interest
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-border" />
                      <DropdownMenuItem className="gap-2" onClick={() => runArchive(lead.id)}>
                        <Archive className="h-4 w-4" /> Archive
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2 text-destructive focus:bg-destructive/10" onClick={() => runDelete(lead.id)}>
                        <Trash2 className="h-4 w-4" /> Remove
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-2 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground sm:text-sm">
          <span className="font-medium text-foreground">{leads.length}</span> on this page
          {typeof total === "number" ? (
            <>
              {" "}
              · <span className="font-medium text-foreground">{total}</span> total
            </>
          ) : null}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {onPageChange && totalPages > 1 ? (
            <>
              <Button type="button" variant="outline" size="sm" disabled={pending || page <= 1} onClick={() => onPageChange(page - 1)}>
                Prev
              </Button>
              <span className="text-xs text-muted-foreground">
                {page} / {totalPages}
              </span>
              <Button type="button" variant="outline" size="sm" disabled={pending || page >= totalPages} onClick={() => onPageChange(page + 1)}>
                Next
              </Button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
