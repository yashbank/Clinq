"use client";

import { useMemo, useState } from "react";

import { countLeadsBySourceFilter, getLeadImportedAtIso, leadMatchesSourceFilter, type LeadSourceFilter } from "@/lib/leads/source-filters";

import { FloatingAIOrb } from "@/components/dashboard/floating-ai-orb";
import { Sidebar } from "@/components/dashboard/sidebar";
import { useLeadCapture } from "@/components/leads/lead-quick-capture-root";
import { AdvancedLeadsTable } from "@/components/leads/advanced-leads-table";
import { LeadsWorkspaceHints } from "@/components/leads/leads-workspace-hints";
import { LeadIntelligenceHeader } from "@/components/leads/lead-intelligence-header";
import { LeadProfilePanel } from "@/components/leads/lead-profile-panel";
import { mapLeadRowToUiLead } from "@/lib/mappers/lead";

import type { FreelancerMatchContext } from "@/components/leads/lead-freelancer-match-section";
import type { LeadRow } from "@/types/database";

export default function LeadsPageClient({
  initialRows,
  freelancerContext,
}: {
  initialRows: LeadRow[];
  freelancerContext: FreelancerMatchContext;
}) {
  const { openCapture } = useLeadCapture();
  const [selectedLead, setSelectedLead] = useState<string | null>(null);
  const [listSearch, setListSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState<LeadSourceFilter>("all");

  const sourceCounts = useMemo(() => countLeadsBySourceFilter(initialRows), [initialRows]);

  const importSummaryLine = useMemo(() => {
    let latest: Date | null = null;
    for (const r of initialRows) {
      const t = getLeadImportedAtIso(r);
      if (!t) continue;
      const d = new Date(t);
      if (!Number.isNaN(d.getTime()) && (!latest || d > latest)) latest = d;
    }
    if (!latest && sourceCounts.imported === 0) return null;
    const n = sourceCounts.imported;
    if (n === 0) return null;
    return `${n} imported lead${n === 1 ? "" : "s"} · latest ${latest ? latest.toLocaleDateString() : "—"}`;
  }, [initialRows, sourceCounts.imported]);

  const sourceFilteredRows = useMemo(
    () => initialRows.filter((r) => leadMatchesSourceFilter(r, sourceFilter)),
    [initialRows, sourceFilter],
  );

  const filteredRows = useMemo(() => {
    const q = listSearch.trim().toLowerCase();
    if (!q) return sourceFilteredRows;
    return sourceFilteredRows.filter((r) => {
      const meta = r.metadata && typeof r.metadata === "object" ? (r.metadata as Record<string, unknown>) : {};
      const title = typeof meta.project_title === "string" ? meta.project_title : "";
      const hay = [r.client_name, r.company ?? "", title, r.project_description ?? "", r.platform ?? ""]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [sourceFilteredRows, listSearch]);

  const filteredUiLeads = useMemo(() => filteredRows.map((r) => mapLeadRowToUiLead(r)), [filteredRows]);

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
            sourceFilter={sourceFilter}
            onSourceFilterChange={setSourceFilter}
            sourceCounts={sourceCounts}
            importSummaryLine={importSummaryLine}
          />

          <main className="flex-1 overflow-y-auto p-4 sm:p-6">
            <div className="mx-auto max-w-7xl space-y-6">
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

        {detail ? (
          <LeadProfilePanel
            detail={detail}
            onClose={() => setSelectedLead(null)}
            freelancerContext={freelancerContext}
          />
        ) : null}
      </div>

      <FloatingAIOrb />
    </div>
  );
}
