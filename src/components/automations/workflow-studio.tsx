"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Zap } from "lucide-react";

import { createWorkflowAction, deleteWorkflowAction, updateWorkflowAction } from "@/actions/workflows";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { AutomationWorkflowRow, WorkflowTypeId } from "@/types/workflows";

const TYPES: { id: WorkflowTypeId; title: string; desc: string }[] = [
  {
    id: "follow_up_reminder",
    title: "Follow-up reminder",
    desc: "Plan a nudge after N days (scheduler executes later).",
  },
  {
    id: "proposal_reminder",
    title: "Proposal reminder",
    desc: "Remind yourself to refresh or resend a proposal after N days.",
  },
  {
    id: "lead_priority",
    title: "Lead priority",
    desc: "Flag leads at or above a score threshold for faster triage.",
  },
];

function defaultConfig(type: WorkflowTypeId): Record<string, unknown> {
  if (type === "follow_up_reminder") return { days_after: 3, note: "" };
  if (type === "proposal_reminder") return { days_after: 2 };
  return { min_score: 75 };
}

function summarize(row: AutomationWorkflowRow): string {
  const c = row.config as Record<string, unknown>;
  if (row.workflow_type === "follow_up_reminder") {
    const d = typeof c.days_after === "number" ? c.days_after : "?";
    const n = typeof c.note === "string" && c.note.trim() ? ` · ${c.note.trim().slice(0, 80)}` : "";
    return `${d} day(s) after touchpoint${n}`;
  }
  if (row.workflow_type === "proposal_reminder") {
    const d = typeof c.days_after === "number" ? c.days_after : "?";
    return `${d} day(s) after proposal`;
  }
  const m = typeof c.min_score === "number" ? c.min_score : "?";
  return `Highlight leads ≥ ${m} score`;
}

export function WorkflowStudio({ initial }: { initial: AutomationWorkflowRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [rows, setRows] = useState(initial);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<WorkflowTypeId>("follow_up_reminder");
  const [days, setDays] = useState(3);
  const [note, setNote] = useState("");
  const [minScore, setMinScore] = useState(75);

  const busy = pending;

  useEffect(() => {
    setRows(initial);
  }, [initial]);

  const resetForm = () => {
    setName("");
    setType("follow_up_reminder");
    setDays(3);
    setNote("");
    setMinScore(75);
  };

  const submitNew = () => {
    if (!name.trim()) {
      toast.error("Name your workflow");
      return;
    }
    let config: Record<string, unknown> = {};
    if (type === "follow_up_reminder") config = { days_after: days, ...(note.trim() ? { note: note.trim() } : {}) };
    else if (type === "proposal_reminder") config = { days_after: days };
    else config = { min_score: minScore };

    startTransition(() => {
      void (async () => {
        const res = await createWorkflowAction({ name: name.trim(), workflow_type: type, config });
        if (!res.ok) {
          toast.error(res.error);
          return;
        }
        toast.success("Workflow saved");
        setOpen(false);
        resetForm();
        router.refresh();
      })();
    });
  };

  const toggleEnabled = (id: string, currentEnabled: boolean) => {
    startTransition(() => {
      void (async () => {
        const res = await updateWorkflowAction(id, { enabled: !currentEnabled });
        if (!res.ok) toast.error(res.error);
        else router.refresh();
      })();
    });
  };

  const remove = (id: string) => {
    startTransition(() => {
      void (async () => {
        const res = await deleteWorkflowAction(id);
        if (!res.ok) toast.error(res.error);
        else {
          toast.message("Workflow removed");
          router.refresh();
        }
      })();
    });
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-12">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Saved workflow rules</h2>
          <p className="mt-1 max-w-xl text-xs leading-relaxed text-muted-foreground">
            Enable or remove definitions you have stored. Execution on a schedule is not enabled in this release — rules
            are intent only.
          </p>
        </div>
        <Button type="button" size="sm" className="shrink-0 gap-2 self-start sm:self-auto" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" />
          New workflow
        </Button>
      </header>

      {open ? (
        <div className="rounded-2xl border border-border/80 bg-background/50 p-5 sm:p-6">
          <h2 className="text-sm font-semibold text-foreground">Create workflow</h2>
          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="wf-name">Name</Label>
              <Input id="wf-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Upwork follow-up" />
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Type</p>
              <div className="grid gap-2 sm:grid-cols-3">
                {TYPES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setType(t.id);
                      const d = defaultConfig(t.id);
                      if ("days_after" in d) setDays(Number(d.days_after));
                      if ("min_score" in d) setMinScore(Number(d.min_score));
                    }}
                    className={cn(
                      "rounded-xl border px-3 py-3 text-left text-sm transition-colors",
                      type === t.id ? "border-primary/40 bg-primary/10 text-foreground" : "border-border hover:bg-muted/20",
                    )}
                  >
                    <span className="font-medium">{t.title}</span>
                    <span className="mt-1 block text-xs text-muted-foreground">{t.desc}</span>
                  </button>
                ))}
              </div>
            </div>
            {(type === "follow_up_reminder" || type === "proposal_reminder") && (
              <div className="space-y-2">
                <Label htmlFor="days">Days after</Label>
                <Input
                  id="days"
                  type="number"
                  min={1}
                  max={60}
                  value={days}
                  onChange={(e) => setDays(Number(e.target.value) || 1)}
                  className="max-w-[8rem]"
                />
              </div>
            )}
            {type === "follow_up_reminder" && (
              <div className="space-y-2">
                <Label htmlFor="note">Optional note</Label>
                <Input id="note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="What to remind yourself about" />
              </div>
            )}
            {type === "lead_priority" && (
              <div className="space-y-2">
                <Label htmlFor="min">Minimum score</Label>
                <Input
                  id="min"
                  type="number"
                  min={0}
                  max={100}
                  value={minScore}
                  onChange={(e) => setMinScore(Number(e.target.value) || 0)}
                  className="max-w-[8rem]"
                />
              </div>
            )}
            <div className="flex flex-wrap gap-2 pt-2">
              <Button type="button" disabled={busy} onClick={submitNew}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save workflow"}
              </Button>
              <Button type="button" variant="ghost" onClick={() => { setOpen(false); resetForm(); }}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="space-y-3">
        {rows.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/80 bg-background/30 px-6 py-14 text-center">
            <Zap className="mx-auto h-8 w-8 text-primary/80" />
            <p className="mt-4 text-sm font-medium text-foreground">No workflows yet</p>
            <p className="mt-2 text-sm text-muted-foreground">Create a definition—execution ships in a later release.</p>
          </div>
        ) : (
          rows.map((row) => (
            <div
              key={row.id}
              className="flex flex-col gap-4 rounded-2xl border border-border/70 bg-background/40 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"
            >
              <div className="min-w-0">
                <p className="font-medium text-foreground">{row.name}</p>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{row.workflow_type.replace(/_/g, " ")}</p>
                <p className="mt-2 text-sm text-muted-foreground">{summarize(row)}</p>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => toggleEnabled(row.id, row.enabled)}>
                  {row.enabled ? "Disable" : "Enable"}
                </Button>
                <Button type="button" size="icon" variant="ghost" className="text-destructive" disabled={busy} onClick={() => remove(row.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
