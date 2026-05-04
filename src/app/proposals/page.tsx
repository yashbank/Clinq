"use client";

import { useState } from "react";

import { ProposalStudioProvider } from "@/context/proposal-studio";
import { Sidebar } from "@/components/dashboard/sidebar";
import { ProposalStudioHeader } from "@/components/proposals/proposal-studio-header";
import { JobDescriptionInput } from "@/components/proposals/job-description-input";
import { ClientPsychologyAnalysis } from "@/components/proposals/client-psychology-analysis";
import { AIWritingPanel } from "@/components/proposals/ai-writing-panel";
import { ProposalSettings } from "@/components/proposals/proposal-settings";
import { SnippetsLibrary } from "@/components/proposals/snippets-library";
import { ProposalHistory } from "@/components/proposals/proposal-history";
import { PortfolioMatcher } from "@/components/proposals/portfolio-matcher";
import { PerformancePrediction } from "@/components/proposals/performance-prediction";

export default function ProposalsPage() {
  const [showSnippets, setShowSnippets] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  return (
    <ProposalStudioProvider>
      <div className="flex min-h-screen bg-background gradient-mesh">
        <Sidebar />
        <main className="flex flex-1 flex-col overflow-hidden">
          <ProposalStudioHeader
            onOpenSnippets={() => setShowSnippets(true)}
            onOpenHistory={() => setShowHistory(true)}
          />
          <div className="flex flex-1 flex-col overflow-hidden lg:flex-row">
            <div className="flex w-full shrink-0 flex-col gap-4 overflow-y-auto border-clinq-glass-border p-4 sm:p-5 lg:max-w-[420px] lg:border-r">
              <JobDescriptionInput />
              <ClientPsychologyAnalysis />
              <PortfolioMatcher />
            </div>

            <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
              <AIWritingPanel />
            </div>

            <div className="flex w-full shrink-0 flex-col gap-4 overflow-y-auto border-clinq-glass-border p-4 sm:p-5 lg:max-w-[340px] lg:border-l">
              <ProposalSettings />
              <PerformancePrediction />
            </div>
          </div>
        </main>

        {showSnippets ? <SnippetsLibrary onClose={() => setShowSnippets(false)} /> : null}
        {showHistory ? <ProposalHistory onClose={() => setShowHistory(false)} /> : null}
      </div>
    </ProposalStudioProvider>
  );
}
