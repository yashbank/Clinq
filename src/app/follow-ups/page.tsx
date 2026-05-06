import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Sidebar } from "@/components/dashboard/sidebar";
import { TopNavbar } from "@/components/dashboard/top-navbar";
import { FloatingAIOrb } from "@/components/dashboard/floating-ai-orb";
import { FollowUpsWorkspace } from "@/components/follow-ups/follow-ups-workspace";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import type { ActivityRow } from "@/types/database";

export const metadata: Metadata = {
  title: "Follow-ups",
};

export default async function FollowUpsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: rows, error } = await supabase
    .from("activities")
    .select("*")
    .eq("user_id", user.id)
    .eq("type", "follow_up_reminder")
    .order("created_at", { ascending: false })
    .limit(80);

  if (error) {
    return (
      <div className="gradient-mesh flex min-h-screen items-center justify-center p-6 text-center text-sm text-muted-foreground">
        Could not load reminders ({error.message}).
      </div>
    );
  }

  return (
    <div className="gradient-mesh flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <TopNavbar title="Follow-ups" subtitle="Reminders in your workspace · AI drafts only" />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <FollowUpsWorkspace initialRows={(rows ?? []) as ActivityRow[]} />
        </main>
      </div>
      <FloatingAIOrb />
    </div>
  );
}
