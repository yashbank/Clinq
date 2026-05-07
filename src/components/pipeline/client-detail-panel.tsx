"use client";

import Link from "next/link";
import { X, Calendar, DollarSign } from "lucide-react";

import { Button } from "@/components/ui/button";

import type { KanbanLead } from "@/components/pipeline/kanban-board";

interface ClientDetailPanelProps {
  clientId: string;
  onClose: () => void;
  summary?: KanbanLead | null;
}

export function ClientDetailPanel({ clientId, onClose, summary }: ClientDetailPanelProps) {
  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-border/50 bg-background/95 shadow-2xl shadow-black/10 backdrop-blur-md dark:shadow-black/35">
      <div className="flex items-center justify-between border-b border-border/55 px-4 py-3">
        <div>
          <p className="text-xs text-muted-foreground">Project</p>
          <h2 className="text-lg font-semibold text-foreground">{summary?.title ?? "Lead"}</h2>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-10 w-10 shrink-0">
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex-1 space-y-4 overflow-y-auto p-4 text-sm text-muted-foreground">
        {summary?.summary ? <p className="text-sm leading-relaxed text-foreground/90">{summary.summary}</p> : null}
        <div className="grid gap-2 rounded-xl border border-border/60 bg-muted/30 p-3 shadow-sm">
          <div className="flex items-center gap-2 text-foreground">
            <DollarSign className="h-4 w-4 text-primary" />
            <span className="font-medium">Budget & score</span>
          </div>
          <p className="text-xs">
            {summary?.showBudget ? summary.budgetLabel : "Budget not shown"} · AI score {summary?.score ?? "—"}
            {summary && summary.score >= 80 ? (
              <span className="ml-1 font-medium text-clinq-success">· Strong fit</span>
            ) : null}
          </p>
        </div>
        <div className="grid gap-2 rounded-xl border border-border/60 bg-muted/30 p-3 shadow-sm">
          <div className="flex items-center gap-2 text-foreground">
            <Calendar className="h-4 w-4 text-primary" />
            <span className="font-medium">Stage</span>
          </div>
          <p className="text-xs capitalize">{summary?.stage ?? "unknown"}</p>
        </div>
      </div>
      <div className="border-t border-border/55 p-4">
        <Button className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground" asChild>
          <Link href={`/proposals?leadId=${encodeURIComponent(clientId)}`}>Generate proposal</Link>
        </Button>
      </div>
    </div>
  );
}
