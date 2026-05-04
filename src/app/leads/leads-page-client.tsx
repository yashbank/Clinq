"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { FloatingAIOrb } from "@/components/dashboard/floating-ai-orb";
import { Sidebar } from "@/components/dashboard/sidebar";
import { AddLeadDialog } from "@/components/leads/add-lead-dialog";
import { AdvancedLeadsTable } from "@/components/leads/advanced-leads-table";
import { AIOpportunityInsights } from "@/components/leads/ai-opportunity-insights";
import { CompetitorAnalysis } from "@/components/leads/competitor-analysis";
import { LeadIntelligenceHeader } from "@/components/leads/lead-intelligence-header";
import { LeadProfilePanel } from "@/components/leads/lead-profile-panel";
import { mapLeadRowToUiLead } from "@/lib/mappers/lead";

import type { LeadRow } from "@/types/database";

export default function LeadsPageClient({ initialRows }: { initialRows: LeadRow[] }) {
  const router = useRouter();
  const [selectedLead, setSelectedLead] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const uiLeads = useMemo(() => initialRows.map((r) => mapLeadRowToUiLead(r)), [initialRows]);

  const detail = useMemo(() => {
    if (!selectedLead) return null;
    const row = initialRows.find((r) => r.id === selectedLead);
    if (!row) return null;
    return { row, ui: mapLeadRowToUiLead(row) };
  }, [initialRows, selectedLead]);

  const highScore = useMemo(() => initialRows.filter((r) => r.score >= 80).length, [initialRows]);
  const repeatCount = useMemo(() => initialRows.filter((r) => r.repeat_hire).length, [initialRows]);

  return (
    <div className="gradient-mesh flex h-screen overflow-hidden">
      <Sidebar />

      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 flex-col overflow-hidden">
          <LeadIntelligenceHeader
            onAddLead={() => setAddOpen(true)}
            leadCount={initialRows.length}
            highScoreCount={highScore}
            repeatCount={repeatCount}
          />

          <main className="flex-1 overflow-y-auto p-6">
            <div className="mx-auto max-w-7xl space-y-6">
              <div className="grid gap-6 lg:grid-cols-3">
                <AIOpportunityInsights />
                <CompetitorAnalysis />
              </div>

              <AdvancedLeadsTable
                leads={uiLeads}
                selectedLead={selectedLead}
                onSelectLead={setSelectedLead}
              />
            </div>
          </main>
        </div>

        {detail ? <LeadProfilePanel detail={detail} onClose={() => setSelectedLead(null)} /> : null}
      </div>

      <FloatingAIOrb />
      <AddLeadDialog open={addOpen} onOpenChange={setAddOpen} onCreated={() => router.refresh()} />
    </div>
  );
}
