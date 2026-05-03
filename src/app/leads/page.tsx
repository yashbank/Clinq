"use client";

import { useState } from "react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { FloatingAIOrb } from "@/components/dashboard/floating-ai-orb";
import { LeadIntelligenceHeader } from "@/components/leads/lead-intelligence-header";
import { AdvancedLeadsTable } from "@/components/leads/advanced-leads-table";
import { LeadProfilePanel } from "@/components/leads/lead-profile-panel";
import { AIOpportunityInsights } from "@/components/leads/ai-opportunity-insights";
import { CompetitorAnalysis } from "@/components/leads/competitor-analysis";

export default function LeadIntelligencePage() {
  const [selectedLead, setSelectedLead] = useState<string | null>(null);

  return (
    <div className="gradient-mesh flex h-screen overflow-hidden">
      <Sidebar />

      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 flex-col overflow-hidden">
          <LeadIntelligenceHeader />

          <main className="flex-1 overflow-y-auto p-6">
            <div className="mx-auto max-w-7xl space-y-6">
              {/* AI Insights Row */}
              <div className="grid gap-6 lg:grid-cols-3">
                <AIOpportunityInsights />
                <CompetitorAnalysis />
              </div>

              {/* Advanced Leads Table */}
              <AdvancedLeadsTable
                selectedLead={selectedLead}
                onSelectLead={setSelectedLead}
              />
            </div>
          </main>
        </div>

        {/* Lead Profile Side Panel */}
        <LeadProfilePanel
          leadId={selectedLead}
          onClose={() => setSelectedLead(null)}
        />
      </div>

      <FloatingAIOrb />
    </div>
  );
}
