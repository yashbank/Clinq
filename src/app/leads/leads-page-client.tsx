"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

import { FloatingAIOrb } from "@/components/dashboard/floating-ai-orb";
import { Sidebar } from "@/components/dashboard/sidebar";
import { useLeadCapture } from "@/components/leads/lead-quick-capture-root";
import { AdvancedLeadsTable } from "@/components/leads/advanced-leads-table";
import { LeadsWorkspaceHints } from "@/components/leads/leads-workspace-hints";
import { LeadIntelligenceHeader } from "@/components/leads/lead-intelligence-header";
import { LeadProfilePanel } from "@/components/leads/lead-profile-panel";
import type { FreelancerMatchContext } from "@/components/leads/lead-freelancer-match-section";
import type { LeadTabCounts, LeadsListSummary } from "@/lib/leads/fetch-leads-page";
import { mergeLeadsListHref } from "@/lib/leads/leads-url-params";
import type { ParsedLeadsSearchParams } from "@/lib/leads/leads-url-params";
import { mapLeadRowToUiLead } from "@/lib/mappers/lead";
import type { LeadRow } from "@/types/database";

export default function LeadsPageClient({
  initialRows,
  total,
  totalPages,
  parsedQuery,
  tabCounts,
  listSummary,
  freelancerContext,
  preferredCurrency,
  usdToForeignRates,
}: {
  initialRows: LeadRow[];
  total: number;
  totalPages: number;
  parsedQuery: ParsedLeadsSearchParams;
  tabCounts: LeadTabCounts;
  listSummary: LeadsListSummary;
  freelancerContext: FreelancerMatchContext;
  preferredCurrency: string;
  usdToForeignRates: Record<string, number> | null;
}) {
  const { openCapture } = useLeadCapture();
  const router = useRouter();
  const searchParams = useSearchParams();
  const qs = searchParams.toString();

  const [selectedLead, setSelectedLead] = useState<string | null>(null);

  const navigate = (patch: Partial<ParsedLeadsSearchParams>) => {
    router.push(mergeLeadsListHref(qs, patch));
  };

  const mapOpts = useMemo(
    () => ({ preferredCurrency, usdToForeignRates }),
    [preferredCurrency, usdToForeignRates],
  );

  const filteredUiLeads = useMemo(
    () => initialRows.map((r) => mapLeadRowToUiLead(r, mapOpts)),
    [initialRows, mapOpts],
  );

  const detail = useMemo(() => {
    if (!selectedLead) return null;
    const row = initialRows.find((r) => r.id === selectedLead);
    if (!row) return null;
    return { row, ui: mapLeadRowToUiLead(row, mapOpts) };
  }, [initialRows, selectedLead, mapOpts]);

  const importSummaryLine =
    tabCounts.imported > 0 ? `${tabCounts.imported} imported lead${tabCounts.imported === 1 ? "" : "s"}` : null;

  return (
    <div className="gradient-mesh flex h-screen max-h-[100dvh] overflow-hidden">
      <Sidebar />

      <div className="flex min-w-0 flex-1 overflow-hidden">
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <LeadIntelligenceHeader
            onAddLead={openCapture}
            leadCount={listSummary.activeCount}
            highScoreCount={listSummary.highScore80Plus}
            repeatCount={listSummary.repeatCount}
            totalBudget={listSummary.totalBudget}
            preferredCurrency={preferredCurrency}
            usdToForeignRates={usdToForeignRates}
            avgScore={listSummary.avgScore}
            sourceFilter={parsedQuery.source}
            sourceCounts={{
              all: tabCounts.all,
              imported: tabCounts.imported,
              manual: tabCounts.manual,
              freelancer: tabCounts.freelancer,
            }}
            importSummaryLine={importSummaryLine}
            parsedQuery={parsedQuery}
            onNavigate={navigate}
            total={total}
            totalPages={totalPages}
            currentPage={parsedQuery.page}
          />

          <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6">
            <div className="mx-auto max-w-7xl space-y-6">
              <LeadsWorkspaceHints />

              <AdvancedLeadsTable
                leads={filteredUiLeads}
                selectedLead={selectedLead}
                onSelectLead={setSelectedLead}
                onAddLead={openCapture}
                onLeadMutated={() => router.refresh()}
                total={total}
                page={parsedQuery.page}
                totalPages={totalPages}
                onPageChange={(p) => navigate({ page: p })}
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
