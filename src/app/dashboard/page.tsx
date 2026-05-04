import { redirect } from "next/navigation";

import { Sidebar } from "@/components/dashboard/sidebar";
import { TopNavbar } from "@/components/dashboard/top-navbar";
import { AnalyticsCards } from "@/components/dashboard/analytics-cards";
import { LeadsTable } from "@/components/dashboard/leads-table";
import { FuturisticAnalytics } from "@/components/dashboard/futuristic-analytics";
import { PipelinePreview } from "@/components/dashboard/pipeline-preview";
import { ProposalWidget } from "@/components/dashboard/proposal-widget";
import { AIInsightsSidebar } from "@/components/dashboard/ai-insights-sidebar";
import { FloatingAIOrb } from "@/components/dashboard/floating-ai-orb";
import { getDashboardAnalyticsSnapshot } from "@/lib/dashboard-stats";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const snapshot = await getDashboardAnalyticsSnapshot();

  return (
    <div className="gradient-mesh flex h-screen overflow-hidden">
      <Sidebar />

      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 flex-col overflow-hidden">
          <TopNavbar />

          <main className="flex-1 overflow-y-auto p-4 sm:p-6">
            <div className="mx-auto max-w-6xl space-y-5 sm:space-y-6">
              <AnalyticsCards snapshot={snapshot ?? undefined} />

              <FuturisticAnalytics />

              <div className="grid gap-6 lg:grid-cols-2">
                <PipelinePreview />
                <ProposalWidget />
              </div>

              <LeadsTable />
            </div>
          </main>
        </div>

        <AIInsightsSidebar />
      </div>

      <FloatingAIOrb />
    </div>
  );
}
