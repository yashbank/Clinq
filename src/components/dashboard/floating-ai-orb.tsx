"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles, Send, X, Mic } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const shortcuts = [
  { label: "Leads", href: "/leads", hint: "Capture & score" },
  { label: "Proposals", href: "/proposals", hint: "RFP → AI draft" },
  { label: "Pipeline", href: "/pipeline", hint: "Stages" },
  { label: "Follow-ups", href: "/follow-ups", hint: "Nudges" },
] as const;

export function FloatingAIOrb() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-5 right-5 z-50 flex h-12 w-12 items-center justify-center rounded-full border border-clinq-glass-border bg-gradient-to-br from-primary to-primary/85 text-primary-foreground shadow-lg transition-transform duration-200 md:bottom-6 md:right-6",
          isOpen ? "pointer-events-none scale-90 opacity-0" : "scale-100 opacity-100 hover:scale-[1.02]",
        )}
        aria-expanded={isOpen}
        aria-label="Open workspace shortcuts"
      >
        <Sparkles className="h-5 w-5" />
      </button>

      <div
        className={cn(
          "fixed bottom-5 right-5 z-50 w-[min(100vw-2rem,380px)] transition-[opacity,transform] duration-200 md:bottom-6 md:right-6",
          isOpen
            ? "translate-y-0 scale-100 opacity-100"
            : "pointer-events-none translate-y-2 scale-[0.98] opacity-0",
        )}
      >
        <div className="glass-card overflow-hidden rounded-2xl border border-clinq-glass-border shadow-xl">
          <div className="relative flex items-center justify-between border-b border-clinq-glass-border px-4 py-3.5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Workspace</h3>
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-clinq-success" />
                  <span className="text-xs text-muted-foreground">Shortcuts</span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-clinq-glass hover:text-foreground"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="p-4">
            <div className="mb-3 rounded-lg border border-clinq-glass-border/60 bg-clinq-glass/40 p-3.5">
              <p className="text-sm leading-relaxed text-muted-foreground">
                Use <span className="font-medium text-foreground">Leads</span> to save an opportunity, then{" "}
                <span className="font-medium text-foreground">Proposals</span> with the RFP on the left and AI in the center.
                Update stages in <span className="font-medium text-foreground">Pipeline</span> after you submit off-platform.
              </p>
            </div>

            <div className="mb-3">
              <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Go to</p>
              <div className="grid grid-cols-2 gap-2">
                {shortcuts.map((s) => (
                  <Link
                    key={s.href}
                    href={s.href}
                    onClick={() => setIsOpen(false)}
                    className="flex flex-col rounded-lg border border-clinq-glass-border/70 bg-background/40 px-3 py-2 text-left text-sm text-foreground transition-colors hover:border-primary/25 hover:bg-primary/5"
                  >
                    <span className="font-medium">{s.label}</span>
                    <span className="text-[11px] text-muted-foreground">{s.hint}</span>
                  </Link>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      toast.message("Use Proposal studio for AI on your RFP", {
                        description: "Paste the job on Proposals → left column, then generate in the center.",
                      });
                    }
                  }}
                  placeholder="Open Proposals for AI…"
                  className="clinq-input h-10 w-full rounded-lg border border-[var(--control-border)] bg-[var(--control-bg)] pl-3.5 pr-10 text-sm text-foreground placeholder:text-muted-foreground"
                />
                <button
                  type="button"
                  disabled
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 cursor-not-allowed text-muted-foreground opacity-45"
                  aria-label="Voice input not available"
                  title="Voice input not available in this build"
                >
                  <Mic className="h-4 w-4" />
                </button>
              </div>
              <button
                type="button"
                onClick={() => {
                  toast.message("Use Proposal studio for AI on your RFP", {
                    description: "Open Proposals from the grid or sidebar.",
                  });
                }}
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border transition-colors",
                  input.trim()
                    ? "border-primary/40 bg-primary text-primary-foreground"
                    : "border-clinq-glass-border bg-secondary text-muted-foreground",
                )}
                aria-label="Open guidance"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
