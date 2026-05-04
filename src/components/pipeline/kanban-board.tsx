"use client";

import { useMemo } from "react";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { GripVertical } from "lucide-react";

import type { PipelineStage } from "@/types/database";

const STAGES: { id: PipelineStage; label: string; tone: string }[] = [
  { id: "saved", label: "Saved", tone: "bg-muted/40" },
  { id: "applied", label: "Applied", tone: "bg-primary/10" },
  { id: "replied", label: "Replied", tone: "bg-accent/10" },
  { id: "interview", label: "Interview", tone: "bg-clinq-success/10" },
  { id: "active", label: "Active", tone: "bg-primary/15" },
  { id: "completed", label: "Completed", tone: "bg-secondary" },
];

export type KanbanLead = {
  id: string;
  name: string;
  stage: PipelineStage;
  score: number;
  budget: number | null;
};

function formatValue(budget: number | null) {
  if (budget == null || Number.isNaN(budget)) return "—";
  if (budget >= 1000) return `$${(budget / 1000).toFixed(0)}k`;
  return `$${Math.round(budget)}`;
}

function DroppableColumn({
  id,
  label,
  tone,
  count,
  children,
}: {
  id: PipelineStage;
  label: string;
  tone: string;
  count: number;
  children: React.ReactNode;
}) {
  const { isOver, setNodeRef } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex w-64 shrink-0 flex-col rounded-xl border border-clinq-glass-border bg-background/40 backdrop-blur-sm transition-shadow",
        isOver && "ring-2 ring-primary/35 ring-offset-2 ring-offset-background",
      )}
    >
      <div
        className={cn(
          "flex items-center justify-between border-b border-clinq-glass-border px-3 py-2.5",
          tone,
        )}
      >
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
        <span className="text-[10px] text-muted-foreground">{count}</span>
      </div>
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-2">{children}</div>
    </div>
  );
}

function LeadCard({
  card,
  selected,
  onSelect,
}: {
  card: KanbanLead;
  selected: boolean;
  onSelect: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: card.id });
  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.55 : undefined,
  };

  return (
    <button
      ref={setNodeRef}
      type="button"
      style={style}
      {...listeners}
      {...attributes}
      onClick={onSelect}
      className={cn(
        "glass-card-hover group rounded-lg border border-clinq-glass-border p-3 text-left transition-all",
        selected && "ring-2 ring-primary/40 ai-glow-subtle",
        card.score >= 80 && "border-clinq-success/40 bg-clinq-success/5",
      )}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <p className="text-sm font-medium leading-snug text-foreground">{card.name}</p>
        <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
      <div className="flex items-center justify-between gap-2">
        <Badge variant="secondary" className="text-[10px]">
          Score {card.score}
        </Badge>
        <span className="text-xs text-clinq-success">{formatValue(card.budget)}</span>
      </div>
    </button>
  );
}

interface KanbanBoardProps {
  leads: KanbanLead[];
  onSelectClient: (id: string | null) => void;
  selectedClient: string | null;
  onStageChange: (leadId: string, stage: PipelineStage) => Promise<void> | void;
}

export function KanbanBoard({ leads, onSelectClient, selectedClient, onStageChange }: KanbanBoardProps) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const byStage = useMemo(() => {
    const map = new Map<PipelineStage, KanbanLead[]>();
    for (const s of STAGES) {
      map.set(s.id, []);
    }
    for (const lead of leads) {
      const stage = STAGES.some((s) => s.id === lead.stage) ? lead.stage : "saved";
      const list = map.get(stage)!;
      list.push(lead);
    }
    return map;
  }, [leads]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const activeId = String(event.active.id);
    const overId = event.over?.id as PipelineStage | undefined;
    if (!overId || !STAGES.some((s) => s.id === overId)) return;
    const lead = leads.find((l) => l.id === activeId);
    if (!lead || lead.stage === overId) return;
    await onStageChange(activeId, overId);
  };

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex h-full gap-3 overflow-x-auto p-4">
        {STAGES.map((col) => {
          const colLeads = byStage.get(col.id) ?? [];
          return (
            <DroppableColumn key={col.id} id={col.id} label={col.label} tone={col.tone} count={colLeads.length}>
              {colLeads.length === 0 ? (
                <div className="flex flex-1 items-center justify-center py-8 text-center text-xs text-muted-foreground">
                  Drop leads here
                </div>
              ) : (
                colLeads.map((card) => (
                  <LeadCard
                    key={card.id}
                    card={card}
                    selected={selectedClient === card.id}
                    onSelect={() => onSelectClient(selectedClient === card.id ? null : card.id)}
                  />
                ))
              )}
            </DroppableColumn>
          );
        })}
      </div>
    </DndContext>
  );
}
