"use client";

import { useState } from "react";

import { ProposalStudioProvider } from "@/context/proposal-studio";
import { Sidebar } from "@/components/dashboard/sidebar";
import { ProposalStudioHeader } from "@/components/proposals/proposal-studio-header";
import { JobDescriptionInput } from "@/components/proposals/job-description-input";
import { AIWritingPanel } from "@/components/proposals/ai-writing-panel";
import { ProposalSettings } from "@/components/proposals/proposal-settings";
import { SnippetsLibrary } from "@/components/proposals/snippets-library";
import { ProposalHistory } from "@/components/proposals/proposal-history";
import { PortfolioMatcher } from "@/components/proposals/portfolio-matcher";

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
              <div className="glass-card rounded-2xl border border-clinq-glass-border p-4">
                <h3 className="text-sm font-semibold text-foreground">Client angle</h3>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  Tone and proof points come from your RFP text and sections—there is no separate “psychology score” in this release. Keep stakeholder names, risks, and budget signals in the job panel so the model can respect them.
                </p>
              </div>
              <PortfolioMatcher />
            </div>

            <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
              <AIWritingPanel />
            </div>

            <div className="flex w-full shrink-0 flex-col gap-4 overflow-y-auto border-clinq-glass-border p-4 sm:p-5 lg:max-w-[340px] lg:border-l">
              <ProposalSettings />
              <div className="glass-card rounded-2xl border border-clinq-glass-border p-4">
                <h3 className="text-sm font-semibold text-foreground">Win signals</h3>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  Predicted open rates and competitor placement are not shown here—they were illustrative only. Track outcomes by moving leads in Pipeline after you submit on the marketplace.
                </p>
              </div>
            </div>
          </div>
        </main>

        {showSnippets ? <SnippetsLibrary onClose={() => setShowSnippets(false)} /> : null}
        {showHistory ? <ProposalHistory onClose={() => setShowHistory(false)} /> : null}
      </div>
    </ProposalStudioProvider>
  );
}
