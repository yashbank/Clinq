import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Sidebar } from "@/components/dashboard/sidebar";
import { TopNavbar } from "@/components/dashboard/top-navbar";
import { AnalyticsCards } from "@/components/dashboard/analytics-cards";
import { DashboardInsightsStrip } from "@/components/dashboard/dashboard-insights";
import { OpportunityCommandCenter } from "@/components/dashboard/opportunity-command-center";
import { TodayFocusSection } from "@/components/dashboard/today-focus-section";
import { DashboardLeadsSnapshot } from "@/components/dashboard/leads-table";
import { PipelinePreview } from "@/components/dashboard/pipeline-preview";
import { ProposalWidget } from "@/components/dashboard/proposal-widget";
import { AIInsightsSidebar } from "@/components/dashboard/ai-insights-sidebar";
import { FloatingAIOrb } from "@/components/dashboard/floating-ai-orb";
import { DashboardOnboarding } from "@/components/dashboard/dashboard-onboarding";
import { getDashboardPageData } from "@/lib/dashboard-stats";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Overview",
};

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const data = await getDashboardPageData();
  if (!data) {
    redirect("/login");
  }

  const {
    snapshot,
    recentLeads,
    recentProposals,
    stages,
    displayName,
    needsProfileOnboarding,
    recommendations,
    insights,
    topPriorityLeads,
    dailyActions,
    preferredCurrency,
    usdToForeignRates,
    sourceSignals,
  } = data;
  if (needsProfileOnboarding) {
    redirect("/onboarding");
  }
  const isFirstRun = snapshot.activeLeads === 0 && snapshot.proposalsSent === 0;
  const subtitle = displayName ? `Signed in · ${displayName}` : undefined;

  return (
    <div className="gradient-mesh flex h-screen overflow-hidden bg-background">
      <Sidebar />

      <div className="flex min-w-0 flex-1 overflow-hidden">
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <TopNavbar title="Overview" subtitle={subtitle} displayCurrency={preferredCurrency} />

          <main className="flex-1 overflow-y-auto p-3 pb-6 sm:p-6">
            <div className="mx-auto max-w-6xl space-y-5 sm:space-y-7">
              {isFirstRun ? (
                <DashboardOnboarding show={isFirstRun} displayName={displayName} />
              ) : null}

              <AnalyticsCards snapshot={snapshot} />

              <TodayFocusSection actions={dailyActions} recentLeads={recentLeads} recentProposals={recentProposals} />

              <OpportunityCommandCenter
                leads={topPriorityLeads}
                sourceBullets={sourceSignals?.bullets ?? []}
                worthReviewHref={
                  sourceSignals && sourceSignals.highRelevanceSkippedCount > 0
                    ? "/integrations/scraped?state=skipped&minScore=62"
                    : "/integrations/scraped?state=skipped"
                }
              />

              <DashboardInsightsStrip insights={insights} />

              <div className="grid gap-6 lg:grid-cols-2">
                <PipelinePreview
                  stages={stages}
                  totalLeads={snapshot.activeLeads}
                  totalPipelineValueUsd={snapshot.pipelineValue}
                  preferredCurrency={preferredCurrency}
                  usdToForeignRates={usdToForeignRates}
                />
                <ProposalWidget proposals={recentProposals} />
              </div>

              <DashboardLeadsSnapshot leads={recentLeads.slice(0, 6)} />
            </div>
          </main>
        </div>

        <AIInsightsSidebar
          recentLeads={recentLeads}
          proposalCount={snapshot.proposalsSent}
          recommendations={recommendations}
        />
      </div>

      <FloatingAIOrb />
    </div>
  );
}
