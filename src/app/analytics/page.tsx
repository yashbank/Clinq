import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Sidebar } from "@/components/dashboard/sidebar";
import { TopNavbar } from "@/components/dashboard/top-navbar";
import { FloatingAIOrb } from "@/components/dashboard/floating-ai-orb";
import { AnalyticsDashboard } from "@/components/analytics/analytics-dashboard";
import { getAnalyticsSnapshot } from "@/lib/analytics/aggregate";
import { getSourceQualityMetrics } from "@/lib/integrations/source-quality-metrics";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Analytics",
};

export default async function AnalyticsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const [{ data: profRow }, snapshot, sourceQuality] = await Promise.all([
    supabase.from("profiles").select("preferred_currency").eq("id", user.id).maybeSingle(),
    getAnalyticsSnapshot(),
    getSourceQualityMetrics(supabase, user.id, { days: 14 }),
  ]);
  if (!snapshot) {
    redirect("/login");
  }
  const displayCurrency =
    typeof profRow?.preferred_currency === "string" && profRow.preferred_currency.trim()
      ? profRow.preferred_currency.trim()
      : "USD";

  return (
    <div className="gradient-mesh flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <TopNavbar title="Analytics" subtitle="From your workspace data only" displayCurrency={displayCurrency} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <AnalyticsDashboard data={snapshot} sourceQuality={sourceQuality} />
        </main>
      </div>
      <FloatingAIOrb />
    </div>
  );
}
