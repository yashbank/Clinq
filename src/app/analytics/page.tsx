import { redirect } from "next/navigation";

import { Sidebar } from "@/components/dashboard/sidebar";
import { TopNavbar } from "@/components/dashboard/top-navbar";
import { FloatingAIOrb } from "@/components/dashboard/floating-ai-orb";
import { AnalyticsDashboard } from "@/components/analytics/analytics-dashboard";
import { getAnalyticsSnapshot } from "@/lib/analytics/aggregate";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AnalyticsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const snapshot = await getAnalyticsSnapshot();
  if (!snapshot) {
    redirect("/login");
  }

  return (
    <div className="gradient-mesh flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <TopNavbar title="Analytics" subtitle="From your workspace data only" />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <AnalyticsDashboard data={snapshot} />
        </main>
      </div>
      <FloatingAIOrb />
    </div>
  );
}
