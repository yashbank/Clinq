"use client";

import { Circle } from "lucide-react";

const EVENTS = [
  { t: "2h ago", title: "Proposal viewed", detail: "Northwind · Proposal v2" },
  { t: "Yesterday", title: "Interview scheduled", detail: "Acme · Solutions architect" },
  { t: "Mon", title: "Budget clarified", detail: "Globex · raised ceiling +18%" },
  { t: "Last week", title: "Deal won", detail: "Stark · Phase 1 kickoff" },
];

export function ActivityTimeline() {
  return (
    <div className="flex h-full flex-col p-4">
      <h2 className="mb-4 text-sm font-semibold text-foreground">Activity</h2>
      <ul className="space-y-4">
        {EVENTS.map((e) => (
          <li key={e.title + e.t} className="relative flex gap-3">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-clinq-glass-border bg-clinq-glass">
              <Circle className="h-2 w-2 fill-primary text-primary" />
            </span>
            <div>
              <p className="text-xs font-medium text-foreground">{e.title}</p>
              <p className="text-xs text-muted-foreground">{e.detail}</p>
              <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                {e.t}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
