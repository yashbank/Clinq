"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { dismissScrapedLeadsBulkAction, promoteScrapedLeadsBulkAction } from "@/actions/scraped-leads";
import { ScrapedDismissButton } from "@/components/integrations/scraped-dismiss-button";
import { ScrapedPromoteButton } from "@/components/integrations/scraped-promote-button";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
export type ScrapedInteractiveRow = {
  id: string;
  source: string;
  title: string;
  summary: string;
  skipReason: string;
  scoreLabel: string;
  createdLabel: string;
  canPromote: boolean;
  canDismiss: boolean;
};

export function ScrapedLeadsInteractiveSection({ rows }: { rows: ScrapedInteractiveRow[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const actionableIds = useMemo(() => rows.filter((r) => r.canPromote || r.canDismiss).map((r) => r.id), [rows]);
  const selectedIds = useMemo(() => Object.entries(selected).filter(([, v]) => v).map(([k]) => k), [selected]);

  const toggle = (id: string, next: boolean) => {
    setSelected((prev) => ({ ...prev, [id]: next }));
  };

  const selectAllActionable = () => {
    if (selectedIds.length === actionableIds.length && actionableIds.length > 0) {
      setSelected({});
      return;
    }
    const next: Record<string, boolean> = {};
    for (const id of actionableIds) next[id] = true;
    setSelected(next);
  };

  const canBulkPromote = selectedIds.some((id) => rows.find((r) => r.id === id)?.canPromote);
  const canBulkDismiss = selectedIds.some((id) => rows.find((r) => r.id === id)?.canDismiss);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border/70 bg-muted/10 px-3 py-2 text-xs">
        <label className="flex cursor-pointer items-center gap-2 text-muted-foreground">
          <Checkbox
            checked={actionableIds.length > 0 && selectedIds.length === actionableIds.length}
            onCheckedChange={selectAllActionable}
          />
          Select actionable
        </label>
        <span className="text-muted-foreground">{selectedIds.length} selected</span>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={pending || !canBulkPromote}
          className="h-8"
          onClick={() => {
            const ids = selectedIds.filter((id) => rows.find((r) => r.id === id)?.canPromote);
            if (!ids.length) return;
            start(() => {
              void (async () => {
                const res = await promoteScrapedLeadsBulkAction(ids);
                if (!res.ok) {
                  toast.error("Bulk promote failed");
                  return;
                }
                if (res.errors.length) {
                  toast.message(`Promoted ${res.promoted}`, { description: res.errors.slice(0, 2).join(" · ") });
                } else {
                  toast.success(`Promoted ${res.promoted} row(s)`);
                }
                setSelected({});
                router.refresh();
              })();
            });
          }}
        >
          {pending ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : null}
          Promote selected
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={pending || !canBulkDismiss}
          className="h-8"
          onClick={() => {
            const ids = selectedIds.filter((id) => rows.find((r) => r.id === id)?.canDismiss);
            if (!ids.length) return;
            start(() => {
              void (async () => {
                const res = await dismissScrapedLeadsBulkAction(ids);
                if (!res.ok) {
                  toast.error(res.error);
                  return;
                }
                toast.message(`Dismissed ${res.count} row(s)`);
                setSelected({});
                router.refresh();
              })();
            });
          }}
        >
          Dismiss selected
        </Button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card/90 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/20 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                <th className="w-10 px-2 py-3" />
                <th className="px-3 py-3">Title</th>
                <th className="px-3 py-3">Source</th>
                <th className="px-3 py-3">Summary</th>
                <th className="px-3 py-3">Score</th>
                <th className="px-3 py-3">Skip reason</th>
                <th className="px-3 py-3 text-right">Created</th>
                <th className="px-3 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {rows.map((row) => {
                const sel = Boolean(selected[row.id]);
                const canSelect = row.canPromote || row.canDismiss;
                return (
                  <tr key={row.id} className="align-top hover:bg-muted/15">
                    <td className="px-2 py-3">
                      {canSelect ? (
                        <Checkbox checked={sel} onCheckedChange={(v) => toggle(row.id, v === true)} className="border-border" />
                      ) : (
                        <span className="inline-block w-5" />
                      )}
                    </td>
                    <td className="max-w-[180px] px-3 py-3 font-medium text-foreground">{row.title}</td>
                    <td className="whitespace-nowrap px-3 py-3">
                      <span className="rounded-md border border-border bg-muted/30 px-2 py-0.5 text-xs capitalize">{row.source}</span>
                    </td>
                    <td className="max-w-[200px] px-3 py-3 text-muted-foreground">
                      <span className="line-clamp-3 text-xs leading-snug">{row.summary}</span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 tabular-nums text-muted-foreground">{row.scoreLabel}</td>
                    <td className="max-w-[180px] px-3 py-3 text-muted-foreground">
                      <span className="line-clamp-3 text-xs leading-snug">{row.skipReason}</span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-right text-xs tabular-nums text-muted-foreground">{row.createdLabel}</td>
                    <td className="px-3 py-3 text-right">
                      <div className="flex flex-wrap justify-end gap-1">
                        <ScrapedPromoteButton scrapedId={row.id} disabled={!row.canPromote} />
                        <ScrapedDismissButton scrapedId={row.id} disabled={!row.canDismiss} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
