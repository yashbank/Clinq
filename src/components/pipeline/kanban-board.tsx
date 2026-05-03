"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { GripVertical } from "lucide-react";

const STAGES = [
  { id: "saved", label: "Saved", tone: "bg-muted/40" },
  { id: "applied", label: "Applied", tone: "bg-primary/10" },
  { id: "replied", label: "Replied", tone: "bg-accent/10" },
  { id: "interview", label: "Interview", tone: "bg-clinq-success/10" },
  { id: "active", label: "Active", tone: "bg-primary/15" },
  { id: "completed", label: "Completed", tone: "bg-secondary" },
  { id: "repeat", label: "Repeat", tone: "bg-clinq-warning/10" },
  { id: "lost", label: "Lost", tone: "bg-destructive/10" },
] as const;

const MOCK = [
  { id: "1", name: "Acme · API redesign", stage: "interview", score: 88, value: "$18k" },
  { id: "2", name: "Northwind · AI assistant", stage: "applied", score: 76, value: "$12k" },
  { id: "3", name: "Globex · Dashboard", stage: "replied", score: 91, value: "$24k" },
  { id: "4", name: "Umbrella · Mobile", stage: "saved", score: 62, value: "$8k" },
  { id: "5", name: "Stark · Automation", stage: "active", score: 84, value: "$32k" },
];

interface KanbanBoardProps {
  onSelectClient: (id: string | null) => void;
  selectedClient: string | null;
}

export function KanbanBoard({ onSelectClient, selectedClient }: KanbanBoardProps) {
  return (
    <div className="flex h-full gap-3 overflow-x-auto p-4">
      {STAGES.map((col) => (
        <div
          key={col.id}
          className="flex w-64 shrink-0 flex-col rounded-xl border border-clinq-glass-border bg-sidebar/30 backdrop-blur-xl"
        >
          <div
            className={cn(
              "flex items-center justify-between border-b border-clinq-glass-border px-3 py-2.5",
              col.tone
            )}
          >
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {col.label}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {MOCK.filter((c) => c.stage === col.id).length}
            </span>
          </div>
          <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-2">
            {MOCK.filter((c) => c.stage === col.id).map((card) => (
              <button
                key={card.id}
                type="button"
                onClick={() =>
                  onSelectClient(selectedClient === card.id ? null : card.id)
                }
                className={cn(
                  "glass-card-hover group rounded-lg border border-clinq-glass-border p-3 text-left transition-all",
                  selectedClient === card.id && "ring-2 ring-primary/40 ai-glow-subtle"
                )}
              >
                <div className="mb-2 flex items-start justify-between gap-2">
                  <p className="text-sm font-medium leading-snug text-foreground">
                    {card.name}
                  </p>
                  <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="secondary" className="text-[10px]">
                    Score {card.score}
                  </Badge>
                  <span className="text-xs text-clinq-success">{card.value}</span>
                </div>
              </button>
            ))}
            {MOCK.filter((c) => c.stage === col.id).length === 0 && (
              <div className="flex flex-1 items-center justify-center py-8 text-center text-xs text-muted-foreground">
                Drop leads here
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
