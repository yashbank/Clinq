import { redirect } from "next/navigation";

import PipelinePageClient from "@/app/pipeline/pipeline-page-client";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import type { LeadRow } from "@/types/database";

export default async function PipelinePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .is("deleted_at", null)
    .is("archived_at", null)
    .order("updated_at", { ascending: false });

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-center text-sm text-muted-foreground">
        Could not load pipeline ({error.message}). Apply the SQL migration in Supabase if you have not yet.
      </div>
    );
  }

  return <PipelinePageClient initialRows={(data ?? []) as LeadRow[]} />;
}
