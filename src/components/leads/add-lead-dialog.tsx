"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

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
import { LEAD_SOURCES, type LeadSource } from "@/lib/leads/platforms";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
};

const sourceLabels: Record<LeadSource, string> = {
  manual: "Manual",
  freelancer: "Freelancer.com",
  upwork: "Upwork",
  linkedin: "LinkedIn",
  fiverr: "Fiverr",
  other: "Other",
};

export function AddLeadDialog({ open, onOpenChange, onCreated }: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-clinq-glass-border bg-sidebar/95 backdrop-blur-xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add lead</DialogTitle>
          <DialogDescription>
            Capture the opportunity — Clinq scores, flags risk, and suggests a proposal angle automatically.
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
                project_title: String(fd.get("project_title") ?? "") || undefined,
                client_name: String(fd.get("client_name") ?? ""),
                source: String(fd.get("source") ?? "manual") as LeadSource,
                company: String(fd.get("company") ?? "") || undefined,
                platform: String(fd.get("platform") ?? "") || undefined,
                project_url: String(fd.get("project_url") ?? "") || undefined,
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
                proposal_match_notes: String(fd.get("proposal_match_notes") ?? "") || undefined,
              });
              if (!res.ok) {
                setError(res.error);
                return;
              }
              (e.target as HTMLFormElement).reset();
              onOpenChange(false);
              toast.success("Lead saved", { description: `Score ${res.lead.score} · check flags in the table.` });
              onCreated?.();
            });
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="project_title">Project title</Label>
              <Input id="project_title" name="project_title" placeholder="e.g. Next.js analytics dashboard" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="client_name">Client name *</Label>
              <Input id="client_name" name="client_name" required placeholder="Jordan Lee" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="source">Source</Label>
              <select
                id="source"
                name="source"
                defaultValue="manual"
                className="flex h-9 w-full rounded-md border border-input bg-secondary/90 px-3 py-1 text-sm text-foreground shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
              >
                {LEAD_SOURCES.map((s) => (
                  <option key={s} value={s}>
                    {sourceLabels[s]}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="platform">Platform label</Label>
              <Input id="platform" name="platform" placeholder="Visible label (optional)" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="project_url">Project URL</Label>
              <Input id="project_url" name="project_url" type="url" placeholder="https://…" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="project_description">Description</Label>
              <Textarea
                id="project_description"
                name="project_description"
                rows={4}
                placeholder="Scope, stack, timeline, constraints…"
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
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="company">Company</Label>
              <Input id="company" name="company" placeholder="Acme Inc" />
            </div>
            <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-clinq-glass-border px-3 py-2 sm:col-span-2">
              <input type="checkbox" name="repeat_hire" className="h-4 w-4 rounded border border-input" />
              <span>
                <span className="text-sm font-medium">Repeat client</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">Improves fit and win probability in scoring</span>
              </span>
            </label>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="client_history">Client history</Label>
              <Textarea id="client_history" name="client_history" rows={2} placeholder="Past wins, stakeholders, tone…" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="proposal_match_notes">Your strategy notes</Label>
              <Textarea
                id="proposal_match_notes"
                name="proposal_match_notes"
                rows={2}
                placeholder="Angle you want to take (optional — AI still proposes a default strategy)"
              />
            </div>
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <DialogFooter className="gap-2 sm:gap-0">
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
