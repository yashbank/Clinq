import type { Metadata } from "next";
import { redirect } from "next/navigation";

import PipelinePageClient from "@/app/pipeline/pipeline-page-client";
import { getUsdToForeignRates } from "@/lib/currency/exchange-rates";
import { formatWorkspaceLoadError } from "@/lib/errors/format-user-error";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import type { LeadRow } from "@/types/database";

export const metadata: Metadata = {
  title: "Pipeline",
};

export default async function PipelinePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase.from("profiles").select("preferred_currency").eq("id", user.id).maybeSingle();
  const preferredCurrency =
    typeof profile?.preferred_currency === "string" && profile.preferred_currency.trim()
      ? profile.preferred_currency.trim()
      : "USD";

  let usdToForeignRates: Record<string, number> | null = null;
  try {
    usdToForeignRates = await getUsdToForeignRates();
  } catch {
    usdToForeignRates = null;
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
        {formatWorkspaceLoadError("pipeline", error.message)}
      </div>
    );
  }

  return (
    <PipelinePageClient
      initialRows={(data ?? []) as LeadRow[]}
      preferredCurrency={preferredCurrency}
      usdToForeignRates={usdToForeignRates}
    />
  );
}
