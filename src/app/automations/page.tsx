import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Sidebar } from "@/components/dashboard/sidebar";
import { TopNavbar } from "@/components/dashboard/top-navbar";
import { FloatingAIOrb } from "@/components/dashboard/floating-ai-orb";
import { WorkflowIntelligencePanel } from "@/components/automations/workflow-intelligence-panel";
import { WorkflowStudio } from "@/components/automations/workflow-studio";
import { buildWorkflowSuggestions } from "@/lib/automation/workflow-intelligence";
import { fetchWorkflowIntelligenceInput } from "@/lib/automation/fetch-workflow-intelligence-input";
import { formatWorkspaceLoadError } from "@/lib/errors/format-user-error";
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

  const { data: profileRow } = await supabase
    .from("profiles")
    .select("skills, tech_stack, niches")
    .eq("id", user.id)
    .maybeSingle();

  const [{ data, error }, intInput] = await Promise.all([
    supabase
      .from("automation_workflows")
      .select("id, user_id, name, workflow_type, enabled, config, created_at, updated_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    fetchWorkflowIntelligenceInput(supabase, user.id, profileRow),
  ]);

  if (error) {
    return (
      <div className="gradient-mesh flex min-h-screen flex-col items-center justify-center p-8 text-center">
        <p className="max-w-md text-sm text-muted-foreground">{formatWorkspaceLoadError("automations", error.message)}</p>
      </div>
    );
  }

  const suggestions = buildWorkflowSuggestions(intInput);

  return (
    <div className="gradient-mesh flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <TopNavbar title="Automations" subtitle="Suggestions from live data · rules you store" />
        <main className="flex-1 overflow-y-auto p-3 pb-10 sm:p-6">
          <div className="mx-auto max-w-3xl space-y-8">
            <WorkflowIntelligencePanel suggestions={suggestions} />
            <WorkflowStudio initial={(data ?? []) as AutomationWorkflowRow[]} />
          </div>
        </main>
      </div>
      <FloatingAIOrb />
    </div>
  );
}
