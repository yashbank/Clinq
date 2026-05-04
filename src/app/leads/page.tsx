import { redirect } from "next/navigation";

import LeadsPageClient from "@/app/leads/leads-page-client";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import type { LeadRow } from "@/types/database";

export default async function LeadsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const [{ data, error }, { data: profileRow }] = await Promise.all([
    supabase.from("leads").select("*").order("updated_at", { ascending: false }),
    supabase.from("profiles").select("skills, tech_stack, niches").eq("id", user.id).maybeSingle(),
  ]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-center text-sm text-muted-foreground">
        Could not load leads ({error.message}). Apply the SQL migration in Supabase if you have not yet.
      </div>
    );
  }

  const freelancerContext = {
    skills: Array.isArray(profileRow?.skills) ? (profileRow.skills as string[]) : [],
    techStack: Array.isArray(profileRow?.tech_stack) ? (profileRow.tech_stack as string[]) : [],
    niches: Array.isArray(profileRow?.niches) ? (profileRow.niches as string[]) : [],
  };

  return <LeadsPageClient initialRows={(data ?? []) as LeadRow[]} freelancerContext={freelancerContext} />;
}
