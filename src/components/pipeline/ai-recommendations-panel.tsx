"use client";

import { Brain, Clock, MessageSquare, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const RECS = [
  {
    title: "Follow up: Globex",
    body: "Client opened your last message twice—send a short value recap today.",
    icon: MessageSquare,
  },
  {
    title: "Win probability ↑",
    body: "Acme thread shows urgency keywords; propose a milestone plan in the next reply.",
    icon: TrendingUp,
  },
  {
    title: "Timing",
    body: "Best reply window for this timezone: 9–11am local (Tue–Thu).",
    icon: Clock,
  },
];

export function AIRecommendationsPanel() {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">AI recommendations</h2>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Suggestions only—you stay in control of every send.
        </p>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {RECS.map((r) => (
          <div
            key={r.title}
            className="rounded-xl border border-border bg-card/95 p-3 shadow-sm transition-all duration-200 hover:border-primary/20 hover:shadow-md"
          >
            <div className="mb-2 flex items-center gap-2">
              <r.icon className="h-3.5 w-3.5 text-primary" />
              <span className="text-sm font-medium text-foreground">{r.title}</span>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">{r.body}</p>
            <Button
              size="sm"
              variant="ghost"
              className={cn("mt-2 h-7 px-2 text-xs text-primary hover:text-primary")}
            >
              Apply in composer
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
