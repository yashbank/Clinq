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
          "fixed bottom-6 right-6 z-50 flex items-center justify-center transition-all duration-500",
          isOpen ? "scale-0 opacity-0" : "scale-100 opacity-100",
        )}
        aria-expanded={isOpen}
        aria-label="Open workspace shortcuts"
      >
        <div className="absolute h-16 w-16 animate-ping rounded-full bg-primary/20" />
        <div className="absolute h-14 w-14 animate-pulse rounded-full bg-primary/30" />

        <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary via-accent to-clinq-success shadow-lg shadow-primary/30">
          <div className="absolute inset-1 rounded-full bg-gradient-to-br from-primary to-accent blur-sm" />
          <Sparkles className="relative z-10 h-6 w-6 text-white" />
        </div>
      </button>

      <div
        className={cn(
          "fixed bottom-6 right-6 z-50 w-[min(100vw-2rem,380px)] transition-all duration-500",
          isOpen
            ? "translate-y-0 scale-100 opacity-100"
            : "pointer-events-none translate-y-4 scale-95 opacity-0",
        )}
      >
        <div className="glass-card overflow-hidden rounded-2xl border border-clinq-glass-border shadow-2xl shadow-primary/10">
          <div className="relative flex items-center justify-between border-b border-clinq-glass-border px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="relative flex h-10 w-10 items-center justify-center">
                <div className="absolute inset-0 animate-pulse rounded-full bg-gradient-to-br from-primary to-accent opacity-80" />
                <Sparkles className="relative z-10 h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Workspace</h3>
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-clinq-success" />
                  <span className="text-xs text-muted-foreground">Shortcuts — no mock metrics</span>
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

          <div className="p-5">
            <div className="mb-4 rounded-xl bg-clinq-glass/50 p-4">
              <p className="text-sm leading-relaxed text-foreground">
                Use <span className="font-medium text-primary">Leads</span> to save an opportunity, then{" "}
                <span className="font-medium text-primary">Proposals</span> with the RFP on the left and AI in the center.
                Update stages in <span className="font-medium text-primary">Pipeline</span> after you submit off-platform.
              </p>
            </div>

            <div className="mb-4">
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Go to</p>
              <div className="grid grid-cols-2 gap-2">
                {shortcuts.map((s) => (
                  <Link
                    key={s.href}
                    href={s.href}
                    onClick={() => setIsOpen(false)}
                    className="flex flex-col rounded-lg border border-clinq-glass-border bg-clinq-glass/50 px-3 py-2.5 text-left text-sm text-foreground transition-all hover:border-primary/30 hover:bg-primary/10"
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
                  placeholder="Tip: open Proposals for AI…"
                  className="h-11 w-full rounded-xl border border-clinq-glass-border bg-clinq-glass pl-4 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/20"
                />
                <button
                  type="button"
                  disabled
                  className="absolute right-3 top-1/2 -translate-y-1/2 cursor-not-allowed text-muted-foreground opacity-50"
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
                  "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-all",
                  input.trim()
                    ? "bg-gradient-to-r from-primary to-accent text-white shadow-lg shadow-primary/30"
                    : "bg-secondary text-muted-foreground",
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
