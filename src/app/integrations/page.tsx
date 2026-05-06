import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";

import { Sidebar } from "@/components/dashboard/sidebar";
import { TopNavbar } from "@/components/dashboard/top-navbar";
import { FloatingAIOrb } from "@/components/dashboard/floating-ai-orb";
import { IntegrationHub } from "@/components/integrations/integration-hub";
import { getFreelancerIntegrationEnv } from "@/lib/integrations/freelancer/env";
import { getSourceIngestStats } from "@/lib/integrations/source-ingest-stats";
import { loadFreelancerProfileForAi } from "@/lib/profile/load-for-ai";
import { assessProfileCompleteness } from "@/lib/profile/profile-completeness";
import { formatWorkspaceLoadError } from "@/lib/errors/format-user-error";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasSupabaseServiceRoleKey } from "@/utils/env-server";
import type { IntegrationAccountRow } from "@/types/integrations";

export const metadata: Metadata = {
  title: "Integrations",
};

export default async function IntegrationsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const freelancerOAuthConfigured = Boolean(getFreelancerIntegrationEnv());
  /** PAT + OAuth token storage and imports require the service role; OAuth app env is optional when using a personal token. */
  const freelancerImportReady = hasSupabaseServiceRoleKey();

  const [{ data: rows, error }, { data: flJobs }, { data: profRow }, sourceIngestStats, profileForGate] = await Promise.all([
    supabase
      .from("integration_accounts")
      .select("id, user_id, provider, status, meta, sync_status, last_sync_at, import_stats, created_at, updated_at")
      .eq("user_id", user.id),
    supabase
      .from("integration_sync_jobs")
      .select("id, status, job_type, payload, result, error, scheduled_at, completed_at")
      .eq("user_id", user.id)
      .eq("provider", "freelancer")
      .eq("job_type", "lead_import")
      .order("scheduled_at", { ascending: false })
      .limit(15),
    supabase.from("profiles").select("preferred_currency").eq("id", user.id).maybeSingle(),
    getSourceIngestStats(supabase, user.id),
    loadFreelancerProfileForAi(supabase, user.id),
  ]);
  const profileCompleteness = assessProfileCompleteness(profileForGate);
  const displayCurrency =
    typeof profRow?.preferred_currency === "string" && profRow.preferred_currency.trim()
      ? profRow.preferred_currency.trim()
      : "USD";

  if (error) {
    return (
      <div className="gradient-mesh flex min-h-screen flex-col items-center justify-center p-8 text-center">
        <p className="max-w-md text-sm text-muted-foreground">{formatWorkspaceLoadError("integrations", error.message)}</p>
      </div>
    );
  }

  return (
    <div className="gradient-mesh flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <TopNavbar title="Integrations" subtitle="Freelancer API import · other platforms reserved" displayCurrency={displayCurrency} />
        <main className="flex-1 overflow-y-auto p-3 pb-8 sm:p-6">
          <Suspense
            fallback={<div className="mx-auto max-w-4xl animate-pulse rounded-2xl border border-border/60 bg-background/40 p-8 text-sm text-muted-foreground">Loading integrations…</div>}
          >
            <IntegrationHub
              initialAccounts={(rows ?? []) as IntegrationAccountRow[]}
              freelancerOAuthConfigured={freelancerOAuthConfigured}
              freelancerImportReady={freelancerImportReady}
              freelancerImportJobs={flJobs ?? []}
              sourceIngestStats={sourceIngestStats}
              profileCompleteness={profileCompleteness}
            />
          </Suspense>
        </main>
      </div>
      <FloatingAIOrb />
    </div>
  );
}
