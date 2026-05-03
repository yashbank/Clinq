import { Sidebar } from "@/components/dashboard/sidebar";
import { TopNavbar } from "@/components/dashboard/top-navbar";
import { AnalyticsCards } from "@/components/dashboard/analytics-cards";
import { LeadsTable } from "@/components/dashboard/leads-table";
import { FuturisticAnalytics } from "@/components/dashboard/futuristic-analytics";
import { PipelinePreview } from "@/components/dashboard/pipeline-preview";
import { ProposalWidget } from "@/components/dashboard/proposal-widget";
import { AIInsightsSidebar } from "@/components/dashboard/ai-insights-sidebar";
import { FloatingAIOrb } from "@/components/dashboard/floating-ai-orb";

export default function DashboardPage() {
  return (
    <div className="gradient-mesh flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Dashboard Content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Top Navbar */}
          <TopNavbar />

          {/* Scrollable Content */}
          <main className="flex-1 overflow-y-auto p-6">
            <div className="mx-auto max-w-6xl space-y-6">
              {/* Analytics Cards */}
              <AnalyticsCards />

              {/* Futuristic Analytics Charts */}
              <FuturisticAnalytics />

              {/* Pipeline & Proposals Row */}
              <div className="grid gap-6 lg:grid-cols-2">
                <PipelinePreview />
                <ProposalWidget />
              </div>

              {/* Lead Intelligence Table */}
              <LeadsTable />
            </div>
          </main>
        </div>

        {/* AI Insights Sidebar */}
        <AIInsightsSidebar />
      </div>

      {/* Floating AI Orb */}
      <FloatingAIOrb />
    </div>
  );
}
