"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { Check, Clock, Plus, Sparkles } from "lucide-react";

import { createFollowUpReminderAction, updateFollowUpReminderAction } from "@/actions/follow-ups";
import { FollowUpAiDraft } from "@/components/follow-ups/follow-up-ai-draft";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PremiumEmpty } from "@/components/ui/premium-empty";
import { cn } from "@/lib/utils";

import type { ActivityRow } from "@/types/database";

type Meta = {
  status?: string;
  priority?: string;
  remind_at?: string | null;
  note?: string;
};

function parseMeta(row: ActivityRow): Meta {
  const m = row.metadata;
  if (!m || typeof m !== "object" || Array.isArray(m)) return {};
  return m as Meta;
}

export function FollowUpsWorkspace({ initialRows }: { initialRows: ActivityRow[] }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [priority, setPriority] = useState<"low" | "normal" | "high">("normal");
  const [pending, startTransition] = useTransition();

  const sorted = useMemo(
    () => [...initialRows].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [initialRows],
  );

  const openRows = sorted.filter((r) => parseMeta(r).status !== "done");

  const add = () => {
    const t = title.trim();
    if (t.length < 2) {
      toast.error("Add a short title");
      return;
    }
    startTransition(() => {
      void (async () => {
        const res = await createFollowUpReminderAction({
          title: t,
          note: note.trim() || undefined,
          priority,
        });
        if (!res.ok) {
          toast.error(res.error);
          return;
        }
        toast.success("Reminder saved");
        setTitle("");
        setNote("");
        router.refresh();
      })();
    });
  };

  const snooze = (id: string) => {
    const next = new Date(Date.now() + 86_400_000).toISOString();
    startTransition(() => {
      void (async () => {
        const res = await updateFollowUpReminderAction(id, { status: "snoozed", remind_at: next });
        if (!res.ok) {
          toast.error(res.error);
          return;
        }
        toast.message("Snoozed ~24h", { description: "Suggested revisit time saved on this reminder." });
        router.refresh();
      })();
    });
  };

  const markDone = (id: string) => {
    startTransition(() => {
      void (async () => {
        const res = await updateFollowUpReminderAction(id, { status: "done" });
        if (!res.ok) {
          toast.error(res.error);
          return;
        }
        router.refresh();
      })();
    });
  };

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 lg:flex-row lg:items-start">
      <div className="min-w-0 flex-1 space-y-5">
        <div className="rounded-2xl border border-clinq-glass-border/70 bg-background/35 p-4 sm:p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Clock className="h-4 w-4 text-primary" />
            Reminders
          </div>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Stored as your own activity rows — no outbound automation. Use for priorities and timing hints only.
          </p>

          <div className="mt-4 space-y-3 border-t border-clinq-glass-border/50 pt-4">
            <div>
              <Label htmlFor="fu-title">Title</Label>
              <Input
                id="fu-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Ping client after proposal"
                className="mt-1.5 bg-background/50"
              />
            </div>
            <div>
              <Label htmlFor="fu-note">Note (optional)</Label>
              <Input id="fu-note" value={note} onChange={(e) => setNote(e.target.value)} className="mt-1.5 bg-background/50" />
            </div>
            <div>
              <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Priority</p>
              <div className="flex flex-wrap gap-2">
                {(["low", "normal", "high"] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors",
                      priority === p ? "bg-primary/15 text-primary ring-1 ring-primary/30" : "bg-muted/40 text-muted-foreground",
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <Button type="button" size="sm" className="gap-1.5" disabled={pending} onClick={add}>
              <Plus className="h-4 w-4" />
              Add reminder
            </Button>
          </div>
        </div>

        {openRows.length === 0 ? (
          <PremiumEmpty
            icon={Sparkles}
            title="No open follow-ups"
            description="Add a reminder when you owe yourself a nudge. Done items appear in history below."
            className="border-clinq-glass-border/60 bg-background/30 py-10"
          />
        ) : (
          <ul className="relative space-y-0 border-l border-clinq-glass-border/60 pl-5">
            {openRows.map((r) => {
              const m = parseMeta(r);
              const pr = (m.priority ?? "normal").toLowerCase();
              return (
                <li key={r.id} className="relative pb-6 last:pb-0">
                  <span className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-background" />
                  <div className="rounded-xl border border-clinq-glass-border/60 bg-background/40 p-3 sm:p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-foreground">{r.description}</p>
                        {m.note ? <p className="mt-1 text-xs text-muted-foreground">{m.note}</p> : null}
                        <p className="mt-2 text-[11px] text-muted-foreground">
                          Added {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
                          {m.remind_at ? ` · Suggest ${new Date(m.remind_at).toLocaleString()}` : ""}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                            pr === "high"
                              ? "bg-destructive/15 text-destructive"
                              : pr === "low"
                                ? "bg-muted/50 text-muted-foreground"
                                : "bg-primary/10 text-primary",
                          )}
                        >
                          {pr}
                        </span>
                        <span className="rounded-full bg-muted/40 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                          {m.status ?? "open"}
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button type="button" size="sm" variant="outline" className="h-8 text-xs" disabled={pending} onClick={() => snooze(r.id)}>
                        Snooze ~1d
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        className="h-8 gap-1 text-xs"
                        disabled={pending}
                        onClick={() => markDone(r.id)}
                      >
                        <Check className="h-3.5 w-3.5" />
                        Done
                      </Button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {sorted.some((r) => parseMeta(r).status === "done") ? (
          <div className="rounded-xl border border-clinq-glass-border/50 bg-background/25 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">History</p>
            <ul className="mt-2 space-y-2 text-xs text-muted-foreground">
              {sorted
                .filter((r) => parseMeta(r).status === "done")
                .map((r) => (
                  <li key={r.id} className="flex justify-between gap-2 border-b border-clinq-glass-border/30 py-1.5 last:border-0">
                    <span className="min-w-0 truncate text-foreground/90">{r.description}</span>
                    <span className="shrink-0 tabular-nums">{new Date(r.created_at).toLocaleDateString()}</span>
                  </li>
                ))}
            </ul>
          </div>
        ) : null}
      </div>

      <div className="w-full shrink-0 lg:w-[320px]">
        <FollowUpAiDraft />
      </div>
    </div>
  );
}
