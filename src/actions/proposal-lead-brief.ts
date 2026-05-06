"use server";

import { getUsdToForeignRates } from "@/lib/currency/exchange-rates";
import { canonicalLeadProjectTitle } from "@/lib/leads/canonical-lead-display";
import { computeLeadBudgetUiLine } from "@/lib/leads/lead-budget-ui";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { LeadRow } from "@/types/database";

/** Builds RFP seed text for proposal studio using display currency + shared budget formatter. */
export async function loadProposalLeadRfpAction(
  leadId: string,
): Promise<{ ok: true; text: string } | { ok: false; error: string }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Unauthorized" };
  }

  const [{ data: lead, error: leErr }, { data: prof }] = await Promise.all([
    supabase.from("leads").select("*").eq("id", leadId).eq("user_id", user.id).maybeSingle(),
    supabase.from("profiles").select("preferred_currency").eq("id", user.id).maybeSingle(),
  ]);

  if (leErr || !lead) {
    return { ok: false, error: leErr?.message ?? "Lead not found" };
  }

  let usdToForeignRates: Record<string, number> | null = null;
  try {
    usdToForeignRates = await getUsdToForeignRates();
  } catch {
    usdToForeignRates = null;
  }

  const preferredCurrency =
    typeof prof?.preferred_currency === "string" && prof.preferred_currency.trim()
      ? prof.preferred_currency.trim()
      : "USD";

  const row = lead as LeadRow;
  const meta = (row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata)
    ? row.metadata
    : {}) as Record<string, unknown>;
  const title = canonicalLeadProjectTitle(row);
  const url = typeof meta.project_url === "string" ? meta.project_url.trim() : "";
  const { label: budgetLine, show: showBudget } = computeLeadBudgetUiLine(row, preferredCurrency, usdToForeignRates);

  const parts = [
    title ? `Title: ${title}` : "",
    row.project_description ? `Description:\n${String(row.project_description).trim()}` : "",
    showBudget && budgetLine ? `Budget: ${budgetLine}` : "",
    url ? `Listing URL: ${url}` : "",
  ].filter(Boolean);

  return { ok: true, text: parts.join("\n\n") };
}
