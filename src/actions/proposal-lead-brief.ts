"use server";

import { getUsdToForeignRates } from "@/lib/currency/exchange-rates";
import { canonicalProposalRfpSeedFromLead } from "@/lib/leads/canonical-proposal-context";
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
  const text = canonicalProposalRfpSeedFromLead(row, preferredCurrency, usdToForeignRates);
  if (!text.trim()) {
    return { ok: false, error: "Not enough canonical lead fields to build RFP text." };
  }

  return { ok: true, text };
}
