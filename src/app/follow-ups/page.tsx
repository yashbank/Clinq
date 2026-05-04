"use client";

import { useState } from "react";

import { Sidebar } from "@/components/dashboard/sidebar";
import { FloatingAIOrb } from "@/components/dashboard/floating-ai-orb";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const tones = ["professional", "friendly", "confident", "consultative"] as const;

export default function FollowUpsPage() {
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
    <div className="gradient-mesh flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex flex-1 flex-col overflow-hidden">
        <header className="shrink-0 border-b border-clinq-glass-border bg-background/85 px-4 py-3 sm:px-6 sm:py-4">
          <h1 className="text-xl font-semibold text-foreground">Follow-ups</h1>
          <p className="text-sm text-muted-foreground">GPT-4o mini drafts — edit before sending.</p>
        </header>
        <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 overflow-y-auto p-4 sm:p-6">
          <div className="glass-card rounded-2xl border border-clinq-glass-border p-5">
            <Label htmlFor="ctx">Context</Label>
            <Textarea
              id="ctx"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              rows={6}
              className="mt-2 bg-background/40"
              placeholder="Paste the last client message, your proposal summary, or what you want to follow up on."
            />
            <div className="mt-4">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Tone</p>
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
              onClick={generate}
            >
              {loading ? "Generating…" : "Generate follow-up"}
            </Button>
          </div>
          {out ? (
            <div className="glass-card rounded-2xl border border-clinq-glass-border p-5">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Draft</p>
              <pre className="whitespace-pre-wrap text-sm text-foreground">{out}</pre>
            </div>
          ) : null}
        </div>
      </main>
      <FloatingAIOrb />
    </div>
  );
}
