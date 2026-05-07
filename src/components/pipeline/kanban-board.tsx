"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  type DraggableAttributes,
  type DragEndEvent,
  type DragStartEvent,
  type DropAnimation,
  MouseSensor,
  TouchSensor,
  defaultDropAnimationSideEffects,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Clock, GripVertical } from "lucide-react";

import type { PipelineStage } from "@/types/database";

const STAGES: { id: PipelineStage; label: string; tone: string }[] = [
  { id: "saved", label: "Saved", tone: "bg-muted/40" },
  { id: "applied", label: "Applied", tone: "bg-primary/10" },
  { id: "replied", label: "Replied", tone: "bg-accent/10" },
  { id: "interview", label: "Interview", tone: "bg-clinq-success/10" },
  { id: "active", label: "Active", tone: "bg-primary/15" },
  { id: "completed", label: "Completed", tone: "bg-secondary" },
];

const dropAnimation: DropAnimation = {
  duration: 160,
  easing: "cubic-bezier(0.22, 1, 0.36, 1)",
  sideEffects: defaultDropAnimationSideEffects({
    styles: { dragOverlay: { opacity: "0.98" } },
  }),
};

export type KanbanLead = {
  id: string;
  title: string;
  summary: string;
  stage: PipelineStage;
  score: number;
  budgetLabel: string;
  showBudget: boolean;
  budgetKind: "fixed" | "hourly" | "unknown";
};

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
        "flex w-64 shrink-0 flex-col rounded-xl border bg-card/50 backdrop-blur-sm transition-all duration-200 ease-out",
        isOver
          ? "border-primary/35 shadow-md shadow-primary/[0.07] ring-1 ring-primary/25 ring-offset-1 ring-offset-background"
          : "border-border/55 shadow-sm",
      )}
    >
      <div
        className={cn(
          "flex items-center justify-between border-b border-border px-3 py-2.5 transition-colors duration-200",
          tone,
          isOver && "bg-primary/[0.06]",
        )}
      >
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
        <span className="text-[10px] tabular-nums text-muted-foreground">{count}</span>
      </div>
      <div
        className={cn(
          "flex min-h-[4.5rem] flex-1 flex-col gap-2 overflow-y-auto p-2 transition-colors duration-200",
          isOver && "bg-primary/[0.03]",
        )}
      >
        {children}
      </div>
    </div>
  );
}

function LeadCardFace({
  card,
  selected,
  variant,
  dragRef,
  dragStyle,
  dragAttributes,
  dragListeners,
  isDragging,
  onSelect,
}: {
  card: KanbanLead;
  selected: boolean;
  variant: "board" | "overlay";
  dragRef?: (node: HTMLElement | null) => void;
  dragStyle?: React.CSSProperties;
  dragAttributes?: DraggableAttributes;
  dragListeners?: Record<string, unknown>;
  isDragging?: boolean;
  onSelect?: () => void;
}) {
  const body = (
    <>
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-snug text-foreground">{card.title}</p>
          {card.summary ? (
            <p className="mt-1 line-clamp-2 text-xs leading-snug text-muted-foreground">{card.summary}</p>
          ) : null}
        </div>
        <GripVertical
          className={cn(
            "h-4 w-4 shrink-0 touch-none text-muted-foreground transition-opacity duration-200",
            variant === "overlay" ? "opacity-100" : "opacity-0 group-hover:opacity-100",
          )}
          aria-hidden
        />
      </div>
      <div className="flex items-center justify-between gap-2">
        <Badge variant="secondary" className="text-[10px]">
          Score {card.score}
        </Badge>
        {card.showBudget ? (
          <span className="inline-flex items-center gap-1 text-xs tabular-nums text-foreground">
            {card.budgetKind === "hourly" ? (
              <Clock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
            ) : card.budgetKind === "fixed" ? (
              <Briefcase className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
            ) : null}
            {card.budgetLabel}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </div>
    </>
  );

  const sharedClass = cn(
    "group w-full rounded-lg border border-border bg-card/30 p-3 text-left shadow-sm outline-none transition-[transform,box-shadow,border-color,opacity] duration-200 ease-out will-change-transform",
    variant === "board" && "hover:border-primary/25 hover:shadow-md active:cursor-grabbing",
    selected && "ring-2 ring-primary/40 ai-glow-subtle",
    card.score >= 80 && "border-clinq-success/40 bg-clinq-success/5",
    variant === "board" && isDragging && "pointer-events-none scale-[0.99] opacity-40 shadow-none",
    variant === "overlay" && "scale-[1.01] cursor-grabbing shadow-xl ring-1 ring-primary/20",
  );

  if (variant === "overlay") {
    return (
      <div className={sharedClass} aria-hidden>
        {body}
      </div>
    );
  }

  return (
    <button
      ref={dragRef}
      type="button"
      style={dragStyle}
      {...(dragListeners as Record<string, never> | undefined)}
      {...(dragAttributes as Record<string, never> | undefined)}
      onClick={onSelect}
      className={sharedClass}
    >
      {body}
    </button>
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
  };

  return (
    <LeadCardFace
      card={card}
      selected={selected}
      variant="board"
      dragRef={setNodeRef}
      dragStyle={style}
      dragAttributes={attributes}
      dragListeners={listeners}
      isDragging={isDragging}
      onSelect={onSelect}
    />
  );
}

interface KanbanBoardProps {
  leads: KanbanLead[];
  onSelectClient: (id: string | null) => void;
  selectedClient: string | null;
  onStageChange: (leadId: string, stage: PipelineStage) => void;
}

export function KanbanBoard({ leads, onSelectClient, selectedClient, onStageChange }: KanbanBoardProps) {
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 10 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
  );

  const [active, setActive] = useState<KanbanLead | null>(null);

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

  const handleDragStart = (event: DragStartEvent) => {
    const id = String(event.active.id);
    setActive(leads.find((l) => l.id === id) ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActive(null);
    const activeId = String(event.active.id);
    const overId = event.over?.id as PipelineStage | undefined;
    if (!overId || !STAGES.some((s) => s.id === overId)) return;
    const lead = leads.find((l) => l.id === activeId);
    if (!lead || lead.stage === overId) return;
    onStageChange(activeId, overId);
  };

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragCancel={() => setActive(null)}>
      <div className="flex h-full gap-3 overflow-x-auto overscroll-x-contain p-4 touch-pan-x">
        {STAGES.map((col) => {
          const colLeads = byStage.get(col.id) ?? [];
          return (
            <DroppableColumn key={col.id} id={col.id} label={col.label} tone={col.tone} count={colLeads.length}>
              {colLeads.length === 0 ? (
                <div className="flex flex-1 items-center justify-center py-8 text-center text-xs text-muted-foreground">
                  Nothing in this stage
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

      <DragOverlay dropAnimation={dropAnimation}>
        {active ? (
          <div className="w-64 max-w-[min(16rem,calc(100vw-2rem))]">
            <LeadCardFace card={active} selected={false} variant="overlay" />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
