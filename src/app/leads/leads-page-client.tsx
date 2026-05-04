"use client";

import { useMemo, useState } from "react";

import { FloatingAIOrb } from "@/components/dashboard/floating-ai-orb";
import { Sidebar } from "@/components/dashboard/sidebar";
import { useLeadCapture } from "@/components/leads/lead-quick-capture-root";
import { AdvancedLeadsTable } from "@/components/leads/advanced-leads-table";
import { LeadsWorkspaceHints } from "@/components/leads/leads-workspace-hints";
import { LeadIntelligenceHeader } from "@/components/leads/lead-intelligence-header";
import { LeadProfilePanel } from "@/components/leads/lead-profile-panel";
import { mapLeadRowToUiLead } from "@/lib/mappers/lead";

import type { LeadRow } from "@/types/database";

export default function LeadsPageClient({ initialRows }: { initialRows: LeadRow[] }) {
  const { openCapture } = useLeadCapture();
  const [selectedLead, setSelectedLead] = useState<string | null>(null);
  const [listSearch, setListSearch] = useState("");

  const uiLeads = useMemo(() => initialRows.map((r) => mapLeadRowToUiLead(r)), [initialRows]);

  const filteredUiLeads = useMemo(() => {
    const q = listSearch.trim().toLowerCase();
    if (!q) return uiLeads;
    return uiLeads.filter((l) => {
      const hay = [l.name, l.company, l.projectTitle, l.email, l.aiInsight, l.industry].join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [uiLeads, listSearch]);

  const detail = useMemo(() => {
    if (!selectedLead) return null;
    const row = initialRows.find((r) => r.id === selectedLead);
    if (!row) return null;
    return { row, ui: mapLeadRowToUiLead(row) };
  }, [initialRows, selectedLead]);

  const highScore = useMemo(() => initialRows.filter((r) => r.score >= 80).length, [initialRows]);
  const repeatCount = useMemo(() => initialRows.filter((r) => r.repeat_hire).length, [initialRows]);
  const totalBudget = useMemo(
    () => initialRows.reduce((sum, r) => sum + (Number(r.budget) || 0), 0),
    [initialRows],
  );
  const avgScore = useMemo(() => {
    if (initialRows.length === 0) return 0;
    return initialRows.reduce((s, r) => s + r.score, 0) / initialRows.length;
  }, [initialRows]);

  return (
    <div className="gradient-mesh flex h-screen overflow-hidden">
      <Sidebar />

      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 flex-col overflow-hidden">
          <LeadIntelligenceHeader
            onAddLead={openCapture}
            leadCount={initialRows.length}
            highScoreCount={highScore}
            repeatCount={repeatCount}
            totalBudget={totalBudget}
            avgScore={avgScore}
            listSearch={listSearch}
            onListSearchChange={setListSearch}
          />

          <main className="flex-1 overflow-y-auto p-4 sm:p-6">
            <div className="mx-auto max-w-7xl space-y-5 sm:space-y-6">
              <LeadsWorkspaceHints />

              <AdvancedLeadsTable
                leads={filteredUiLeads}
                selectedLead={selectedLead}
                onSelectLead={setSelectedLead}
                onAddLead={openCapture}
              />
            </div>
          </main>
        </div>

        {detail ? <LeadProfilePanel detail={detail} onClose={() => setSelectedLead(null)} /> : null}
      </div>

      <FloatingAIOrb />
    </div>
  );
}
