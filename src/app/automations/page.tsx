import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Sidebar } from "@/components/dashboard/sidebar";
import { TopNavbar } from "@/components/dashboard/top-navbar";
import { FloatingAIOrb } from "@/components/dashboard/floating-ai-orb";
import { WorkflowStudio } from "@/components/automations/workflow-studio";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AutomationWorkflowRow } from "@/types/workflows";

export const metadata: Metadata = {
  title: "Automations",
};

export default async function AutomationsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data, error } = await supabase
    .from("automation_workflows")
    .select("id, user_id, name, workflow_type, enabled, config, created_at, updated_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="gradient-mesh flex min-h-screen flex-col items-center justify-center p-8 text-center">
        <p className="max-w-md text-sm text-muted-foreground">
          Could not load automations ({error.message}). Apply the Phase 3 migration for{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-foreground">automation_workflows</code>.
        </p>
      </div>
    );
  }

  return (
    <div className="gradient-mesh flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <TopNavbar title="Automations" subtitle="Workflow definitions · execution later" />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <WorkflowStudio initial={(data ?? []) as AutomationWorkflowRow[]} />
        </main>
      </div>
      <FloatingAIOrb />
    </div>
  );
}
