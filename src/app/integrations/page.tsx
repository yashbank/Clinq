import { redirect } from "next/navigation";

import { Sidebar } from "@/components/dashboard/sidebar";
import { TopNavbar } from "@/components/dashboard/top-navbar";
import { FloatingAIOrb } from "@/components/dashboard/floating-ai-orb";
import { IntegrationHub } from "@/components/integrations/integration-hub";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { IntegrationAccountRow } from "@/types/integrations";

export default async function IntegrationsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: rows, error } = await supabase
    .from("integration_accounts")
    .select("id, user_id, provider, status, meta, sync_status, last_sync_at, import_stats, credentials, created_at, updated_at")
    .eq("user_id", user.id);

  if (error) {
    return (
      <div className="gradient-mesh flex min-h-screen flex-col items-center justify-center p-8 text-center">
        <p className="max-w-md text-sm text-muted-foreground">
          Could not load integrations ({error.message}). Apply the latest Supabase migration including{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-foreground">integration_accounts</code>.
        </p>
      </div>
    );
  }

  return (
    <div className="gradient-mesh flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <TopNavbar title="Integrations" subtitle="Marketplace links · no automation yet" />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <IntegrationHub initialAccounts={(rows ?? []) as IntegrationAccountRow[]} />
        </main>
      </div>
      <FloatingAIOrb />
    </div>
  );
}
