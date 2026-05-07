"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { updateLeadStageAction } from "@/actions/leads";
import { FloatingAIOrb } from "@/components/dashboard/floating-ai-orb";
import { Sidebar } from "@/components/dashboard/sidebar";
import { PremiumEmpty } from "@/components/ui/premium-empty";
import { ActivityTimeline } from "@/components/pipeline/activity-timeline";
import { AIRecommendationsPanel } from "@/components/pipeline/ai-recommendations-panel";
import { ClientDetailPanel } from "@/components/pipeline/client-detail-panel";
import { KanbanBoard, type KanbanLead } from "@/components/pipeline/kanban-board";
import { PipelineHeader } from "@/components/pipeline/pipeline-header";

import { formatUsdTotalForDisplay, leadBudgetAsUsd } from "@/lib/currency/format-pipeline-budget";
import { formatActionFailure } from "@/lib/errors/format-user-error";
import { leadKanbanBudgetLine, leadKanbanSummary, leadKanbanTitle } from "@/lib/leads/pipeline-display";
import type { LeadRow, PipelineStage } from "@/types/database";
import { LayoutGrid } from "lucide-react";

function toKanban(
  row: LeadRow,
  currency: { preferredCurrency: string; usdToForeignRates: Record<string, number> | null },
): KanbanLead {
  const budget = leadKanbanBudgetLine(row, currency);
  return {
    id: row.id,
    title: leadKanbanTitle(row),
    summary: leadKanbanSummary(row),
    stage: row.stage,
    score: row.score,
    budgetLabel: budget.label,
    showBudget: budget.show,
    budgetKind: budget.kind,
  };
}

export default function PipelinePageClient({
  initialRows,
  preferredCurrency,
  usdToForeignRates,
}: {
  initialRows: LeadRow[];
  preferredCurrency: string;
  usdToForeignRates: Record<string, number> | null;
}) {
  const router = useRouter();
  const [rows, setRows] = useState(initialRows);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [showAIPanel, setShowAIPanel] = useState(true);
  const [showTimeline, setShowTimeline] = useState(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    setRows(initialRows);
  }, [initialRows]);

  const currency = useMemo(
    () => ({ preferredCurrency, usdToForeignRates }),
    [preferredCurrency, usdToForeignRates],
  );
  const kanbanLeads = useMemo(() => rows.map((r) => toKanban(r, currency)), [rows, currency]);
  const totalBudgetUsd = useMemo(
    () => rows.reduce((sum, r) => sum + leadBudgetAsUsd(r, usdToForeignRates), 0),
    [rows, usdToForeignRates],
  );
  const totalBudgetLabel = useMemo(
    () => formatUsdTotalForDisplay(totalBudgetUsd, preferredCurrency, usdToForeignRates),
    [totalBudgetUsd, preferredCurrency, usdToForeignRates],
  );
  const selectedSummary = useMemo(
    () => kanbanLeads.find((l) => l.id === selectedClient) ?? null,
    [kanbanLeads, selectedClient],
  );

  const onStageChange = (leadId: string, stage: KanbanLead["stage"]) => {
    let previousStage: PipelineStage | null = null;
    setRows((prev) => {
      const cur = prev.find((r) => r.id === leadId);
      previousStage = cur?.stage ?? null;
      return prev.map((r) => (r.id === leadId ? { ...r, stage } : r));
    });
    startTransition(async () => {
      const res = await updateLeadStageAction(leadId, stage);
      if (!res.ok) {
        if (previousStage != null) {
          setRows((cur) => cur.map((r) => (r.id === leadId ? { ...r, stage: previousStage! } : r)));
        }
        toast.error(formatActionFailure("Could not move this card", res.error));
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background gradient-mesh">
      <Sidebar />

      <div className="flex flex-1 overflow-hidden">
        <main className="flex flex-1 flex-col overflow-hidden">
          <PipelineHeader
            onToggleAI={() => setShowAIPanel(!showAIPanel)}
            onToggleTimeline={() => setShowTimeline(!showTimeline)}
            showAIPanel={showAIPanel}
            showTimeline={showTimeline}
            leadCount={rows.length}
            totalBudgetLabel={totalBudgetLabel}
          />

          <div className="flex flex-1 overflow-hidden">
            <div className="flex-1 overflow-hidden">
              {rows.length === 0 ? (
                <div className="flex h-full min-h-[50vh] items-center justify-center overflow-y-auto p-4">
                  <PremiumEmpty
                    icon={LayoutGrid}
                    title="Nothing on the board yet"
                    description="Save leads from Lead intelligence or promote imports — then drag cards as stages change. Totals and budget roll up automatically."
                    primary={{ label: "Open Leads", href: "/leads" }}
                    secondary={{ label: "Integrations", href: "/integrations" }}
                    className="w-full max-w-md border-border/70"
                  />
                </div>
              ) : (
                <KanbanBoard
                  leads={kanbanLeads}
                  onSelectClient={setSelectedClient}
                  selectedClient={selectedClient}
                  onStageChange={onStageChange}
                />
              )}
            </div>

            {showTimeline ? (
              <aside className="w-80 shrink-0 overflow-y-auto border-l border-border/50 bg-background/55 shadow-[inset_1px_0_0_0] shadow-black/[0.04] backdrop-blur-sm dark:shadow-black/25">
                <ActivityTimeline />
              </aside>
            ) : null}
          </div>
        </main>

        {showAIPanel ? (
          <aside className="w-80 shrink-0 overflow-y-auto border-l border-border/50 bg-background/60 shadow-[inset_1px_0_0_0] shadow-black/[0.04] backdrop-blur-sm dark:shadow-black/25">
            <AIRecommendationsPanel />
          </aside>
        ) : null}
      </div>

      {selectedClient ? (
        <ClientDetailPanel
          clientId={selectedClient}
          summary={selectedSummary}
          onClose={() => setSelectedClient(null)}
        />
      ) : null}

      <FloatingAIOrb />
    </div>
  );
}
