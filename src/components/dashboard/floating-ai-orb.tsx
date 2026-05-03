"use client";

import { useState } from "react";
import { Sparkles, Send, X, Mic, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const quickActions = [
  { label: "Score leads", icon: "target" },
  { label: "Draft proposal", icon: "file" },
  { label: "Best time to bid", icon: "clock" },
  { label: "Pipeline health", icon: "chart" },
];

export function FloatingAIOrb() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");

  return (
    <>
      {/* Floating Orb Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-6 right-6 z-50 flex items-center justify-center transition-all duration-500",
          isOpen ? "scale-0 opacity-0" : "scale-100 opacity-100"
        )}
      >
        {/* Pulse rings */}
        <div className="absolute h-16 w-16 animate-ping rounded-full bg-primary/20" />
        <div className="absolute h-14 w-14 animate-pulse rounded-full bg-primary/30" />

        {/* Main orb */}
        <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary via-accent to-clinq-success shadow-lg shadow-primary/30">
          <div className="absolute inset-1 rounded-full bg-gradient-to-br from-primary to-accent blur-sm" />
          <Sparkles className="relative z-10 h-6 w-6 text-white" />
        </div>
      </button>

      {/* Expanded AI Panel */}
      <div
        className={cn(
          "fixed bottom-6 right-6 z-50 w-[380px] transition-all duration-500",
          isOpen
            ? "translate-y-0 scale-100 opacity-100"
            : "pointer-events-none translate-y-4 scale-95 opacity-0"
        )}
      >
        <div className="glass-card overflow-hidden rounded-2xl border border-clinq-glass-border shadow-2xl shadow-primary/10">
          {/* Header */}
          <div className="relative flex items-center justify-between border-b border-clinq-glass-border px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="relative flex h-10 w-10 items-center justify-center">
                <div className="absolute inset-0 animate-pulse rounded-full bg-gradient-to-br from-primary to-accent opacity-80" />
                <Sparkles className="relative z-10 h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Clinq AI</h3>
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-clinq-success" />
                  <span className="text-xs text-muted-foreground">
                    Ready to assist
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-clinq-glass hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Content */}
          <div className="p-5">
            {/* Greeting */}
            <div className="mb-4 rounded-xl bg-clinq-glass/50 p-4">
              <p className="text-sm leading-relaxed text-foreground">
                Hey Alex! You have{" "}
                <span className="font-semibold text-primary">3 hot leads</span>{" "}
                ready for proposals and{" "}
                <span className="font-semibold text-clinq-warning">
                  2 follow-ups
                </span>{" "}
                due today.
              </p>
            </div>

            {/* Quick Actions */}
            <div className="mb-4">
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Quick Actions
              </p>
              <div className="grid grid-cols-2 gap-2">
                {quickActions.map((action) => (
                  <button
                    key={action.label}
                    className="flex items-center gap-2 rounded-lg border border-clinq-glass-border bg-clinq-glass/50 px-3 py-2 text-sm text-foreground transition-all hover:border-primary/30 hover:bg-primary/10"
                  >
                    <ArrowRight className="h-3 w-3 text-primary" />
                    {action.label}
                  </button>
                ))}
              </div>
            </div>

            {/* AI Suggestions */}
            <div className="mb-4">
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                AI Suggestions
              </p>
              <div className="space-y-2">
                <button className="flex w-full items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5 text-left transition-all hover:bg-primary/10">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/20">
                    <Sparkles className="h-3 w-3 text-primary" />
                  </span>
                  <span className="text-sm text-foreground">
                    Draft proposal for TechFlow Inc - $24.5K
                  </span>
                </button>
                <button className="flex w-full items-center gap-3 rounded-lg border border-clinq-warning/20 bg-clinq-warning/5 px-3 py-2.5 text-left transition-all hover:bg-clinq-warning/10">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-clinq-warning/20">
                    <Sparkles className="h-3 w-3 text-clinq-warning" />
                  </span>
                  <span className="text-sm text-foreground">
                    Follow up with Quantum Labs about pricing
                  </span>
                </button>
              </div>
            </div>

            {/* Input */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask anything..."
                  className="h-11 w-full rounded-xl border border-clinq-glass-border bg-clinq-glass pl-4 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/20"
                />
                <button className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground">
                  <Mic className="h-4 w-4" />
                </button>
              </div>
              <button
                className={cn(
                  "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-all",
                  input
                    ? "bg-gradient-to-r from-primary to-accent text-white shadow-lg shadow-primary/30"
                    : "bg-secondary text-muted-foreground"
                )}
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
