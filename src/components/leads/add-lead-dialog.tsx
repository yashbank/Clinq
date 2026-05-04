"use client";

import { useState, useTransition } from "react";

import { createLeadAction } from "@/actions/leads";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
};

export function AddLeadDialog({ open, onOpenChange, onCreated }: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg border-clinq-glass-border bg-sidebar/95 backdrop-blur-xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add lead</DialogTitle>
          <DialogDescription>
            Clinq scores automatically from budget, repeat hire, competition, and brief quality.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            setError(null);
            startTransition(async () => {
              const res = await createLeadAction({
                client_name: String(fd.get("client_name") ?? ""),
                company: String(fd.get("company") ?? "") || undefined,
                platform: String(fd.get("platform") ?? "") || undefined,
                project_description: String(fd.get("project_description") ?? "") || undefined,
                budget: fd.get("budget") ? Number(fd.get("budget")) : undefined,
                email: String(fd.get("email") ?? "") || undefined,
                phone: String(fd.get("phone") ?? "") || undefined,
                repeat_hire: fd.get("repeat_hire") === "on",
                competition_level: fd.get("competition_level")
                  ? Number(fd.get("competition_level"))
                  : undefined,
                project_quality: fd.get("project_quality")
                  ? Number(fd.get("project_quality"))
                  : undefined,
                client_history: String(fd.get("client_history") ?? "") || undefined,
              });
              if (!res.ok) {
                setError(res.error);
                return;
              }
              (e.target as HTMLFormElement).reset();
              onOpenChange(false);
              onCreated?.();
            });
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="client_name">Client name *</Label>
              <Input id="client_name" name="client_name" required placeholder="Jordan Lee" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input id="company" name="company" placeholder="Acme Inc" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="platform">Platform</Label>
              <Input id="platform" name="platform" placeholder="Upwork, LinkedIn, …" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="project_description">Project description</Label>
              <Textarea
                id="project_description"
                name="project_description"
                rows={3}
                placeholder="What they need, timeline, stack…"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="budget">Budget (USD)</Label>
              <Input id="budget" name="budget" type="number" min={0} step={100} placeholder="12000" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="competition_level">Competition (1–5)</Label>
              <Input id="competition_level" name="competition_level" type="number" min={1} max={5} defaultValue={2} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project_quality">Brief clarity (1–5)</Label>
              <Input id="project_quality" name="project_quality" type="number" min={1} max={5} defaultValue={3} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="client@email.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" placeholder="+1 …" />
            </div>
            <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-clinq-glass-border px-3 py-2 sm:col-span-2">
              <input type="checkbox" name="repeat_hire" className="h-4 w-4 rounded border border-input" />
              <span>
                <span className="text-sm font-medium">Repeat client</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">Boosts score for loyalty signal</span>
              </span>
            </label>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="client_history">Client history notes</Label>
              <Textarea id="client_history" name="client_history" rows={2} placeholder="Past wins, tone, stakeholders…" />
            </div>
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending} className="bg-gradient-to-r from-primary to-accent text-primary-foreground">
              {pending ? "Saving…" : "Save lead"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
