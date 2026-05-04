"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const tones = ["professional", "friendly", "confident", "consultative"] as const;

export function FollowUpAiDraft() {
  const [context, setContext] = useState("");
  const [tone, setTone] = useState<(typeof tones)[number]>("professional");
  const [out, setOut] = useState("");
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    if (context.trim().length < 15) {
      toast.error("Add more context (prior message, job link, or situation).");
      return;
    }
    setLoading(true);
    setOut("");
    try {
      const res = await fetch("/api/ai/follow-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context, tone }),
      });
      const data = (await res.json()) as { text?: string; error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? "Failed");
      }
      setOut(data.text ?? "");
      toast.success("Follow-up draft ready");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card rounded-2xl border border-clinq-glass-border p-5">
      <Label htmlFor="fu-ctx">AI draft (optional)</Label>
      <Textarea
        id="fu-ctx"
        value={context}
        onChange={(e) => setContext(e.target.value)}
        rows={5}
        className="mt-2 bg-background/40"
        placeholder="Paste context — you still send messages yourself; nothing is auto-sent."
      />
      <div className="mt-3">
        <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Tone</p>
        <div className="flex flex-wrap gap-2">
          {tones.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTone(t)}
              className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors ${
                tone === t ? "bg-primary/20 text-primary ring-1 ring-primary/40" : "bg-clinq-glass text-muted-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
      <Button
        type="button"
        className="mt-4 w-full bg-gradient-to-r from-primary to-accent text-primary-foreground"
        disabled={loading}
        onClick={() => void generate()}
      >
        {loading ? "Generating…" : "Generate draft"}
      </Button>
      {out ? (
        <div className="mt-4 rounded-xl border border-clinq-glass-border/70 bg-background/30 p-3">
          <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Draft</p>
          <pre className="max-h-48 overflow-y-auto whitespace-pre-wrap text-sm text-foreground">{out}</pre>
        </div>
      ) : null}
    </div>
  );
}
