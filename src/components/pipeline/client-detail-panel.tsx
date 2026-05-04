"use client";

import Link from "next/link";
import { X, Mail, Calendar, DollarSign } from "lucide-react";

import { Button } from "@/components/ui/button";

import type { KanbanLead } from "@/components/pipeline/kanban-board";

interface ClientDetailPanelProps {
  clientId: string;
  onClose: () => void;
  summary?: KanbanLead | null;
}

export function ClientDetailPanel({ clientId, onClose, summary }: ClientDetailPanelProps) {
  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-clinq-glass-border bg-background/95 shadow-xl backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-clinq-glass-border px-4 py-3">
        <div>
          <p className="text-xs text-muted-foreground">Lead</p>
          <h2 className="text-lg font-semibold text-foreground">{summary?.name ?? `Client`}</h2>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex-1 space-y-4 overflow-y-auto p-4 text-sm text-muted-foreground">
        <p>
          Live data from Supabase. Stage updates sync to your pipeline board; proposals and activities
          build history over time.
        </p>
        <div className="grid gap-2 rounded-xl border border-clinq-glass-border bg-clinq-glass/30 p-3">
          <div className="flex items-center gap-2 text-foreground">
            <DollarSign className="h-4 w-4 text-primary" />
            <span className="font-medium">Budget & score</span>
          </div>
          <p className="text-xs">
            {summary?.budget != null ? `$${Number(summary.budget).toLocaleString()}` : "Budget not set"} · AI score{" "}
            {summary?.score ?? "—"}
            {summary && summary.score >= 80 ? (
              <span className="ml-1 font-medium text-clinq-success">· High conversion</span>
            ) : null}
          </p>
        </div>
        <div className="grid gap-2 rounded-xl border border-clinq-glass-border bg-clinq-glass/30 p-3">
          <div className="flex items-center gap-2 text-foreground">
            <Calendar className="h-4 w-4 text-primary" />
            <span className="font-medium">Stage</span>
          </div>
          <p className="text-xs capitalize">{summary?.stage ?? "unknown"}</p>
        </div>
        <div className="grid gap-2 rounded-xl border border-clinq-glass-border bg-clinq-glass/30 p-3">
          <div className="flex items-center gap-2 text-foreground">
            <Mail className="h-4 w-4 text-primary" />
            <span className="font-medium">Reference</span>
          </div>
          <p className="text-xs">Lead id: {clientId}</p>
        </div>
      </div>
      <div className="border-t border-clinq-glass-border p-4">
        <Button className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground" asChild>
          <Link href="/proposals">Open proposal studio</Link>
        </Button>
      </div>
    </div>
  );
}
