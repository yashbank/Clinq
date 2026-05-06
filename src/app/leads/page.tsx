import type { Metadata } from "next";
import { redirect } from "next/navigation";

import LeadsPageClient from "@/app/leads/leads-page-client";
import { getUsdToForeignRates } from "@/lib/currency/exchange-rates";
import { fetchLeadTabCounts, fetchLeadsListSummary, fetchLeadsPage } from "@/lib/leads/fetch-leads-page";
import { parseLeadsSearchParams } from "@/lib/leads/leads-url-params";
import { formatWorkspaceLoadError } from "@/lib/errors/format-user-error";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import type { LeadRow } from "@/types/database";

export const metadata: Metadata = {
  title: "Lead Intelligence",
};

export default async function LeadsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const sp = await searchParams;
  const parsed = parseLeadsSearchParams(sp);

  let rows: LeadRow[] = [];
  let total = 0;
  let tabCounts = { all: 0, imported: 0, manual: 0, freelancer: 0 };
  let listSummary = { activeCount: 0, highScore80Plus: 0, repeatCount: 0, totalBudget: 0, avgScore: 0 };
  let loadError: string | null = null;

  const { data: profileRow } = await supabase
    .from("profiles")
    .select("skills, tech_stack, niches, preferred_currency")
    .eq("id", user.id)
    .maybeSingle();
  const profileSearchTokens = [
    ...(Array.isArray(profileRow?.skills) ? (profileRow.skills as string[]) : []),
    ...(Array.isArray(profileRow?.tech_stack) ? (profileRow.tech_stack as string[]) : []),
    ...(Array.isArray(profileRow?.niches) ? (profileRow.niches as string[]) : []),
  ];

  let usdToForeignRates: Record<string, number> | null = null;
  try {
    usdToForeignRates = await getUsdToForeignRates();
  } catch {
    usdToForeignRates = null;
  }
  const preferredCurrency =
    typeof profileRow?.preferred_currency === "string" && profileRow.preferred_currency.trim()
      ? profileRow.preferred_currency.trim()
      : "USD";

  try {
    const [pageRes, counts, summary] = await Promise.all([
      fetchLeadsPage(supabase, {
        page: parsed.page,
        pageSize: 20,
        q: parsed.q,
        source: parsed.source,
        platform: parsed.platform,
        scoreBand: parsed.scoreBand,
        stage: parsed.stage,
        view: parsed.view,
        sort: parsed.sort,
        profileSearchTokens,
        freelancerProfile: {
          skills: Array.isArray(profileRow?.skills) ? (profileRow.skills as string[]) : [],
          tech_stack: Array.isArray(profileRow?.tech_stack) ? (profileRow.tech_stack as string[]) : [],
          niches: Array.isArray(profileRow?.niches) ? (profileRow.niches as string[]) : [],
        },
      }),
      fetchLeadTabCounts(supabase),
      fetchLeadsListSummary(supabase),
    ]);
    rows = pageRes.rows;
    total = pageRes.total;
    tabCounts = counts;
    listSummary = summary;
  } catch (e) {
    loadError = e instanceof Error ? e.message : "Could not load leads";
  }

  if (loadError) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-center text-sm text-muted-foreground">
        <div className="max-w-md space-y-2">
          <p>{formatWorkspaceLoadError("leads", loadError)}</p>
          <p className="text-xs text-muted-foreground">
            If you self-host Supabase, confirm migrations for leads lifecycle and <code className="rounded bg-muted px-1">lead_tab_counts</code> are applied.
          </p>
        </div>
      </div>
    );
  }

  const freelancerContext = {
    skills: Array.isArray(profileRow?.skills) ? (profileRow.skills as string[]) : [],
    techStack: Array.isArray(profileRow?.tech_stack) ? (profileRow.tech_stack as string[]) : [],
    niches: Array.isArray(profileRow?.niches) ? (profileRow.niches as string[]) : [],
  };

  const pageSize = 20;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <LeadsPageClient
      initialRows={rows}
      total={total}
      totalPages={totalPages}
      parsedQuery={parsed}
      tabCounts={tabCounts}
      listSummary={listSummary}
      freelancerContext={freelancerContext}
      preferredCurrency={preferredCurrency}
      usdToForeignRates={usdToForeignRates}
    />
  );
}
