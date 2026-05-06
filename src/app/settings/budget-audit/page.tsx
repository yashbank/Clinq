import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Sidebar } from "@/components/dashboard/sidebar";
import { TopNavbar } from "@/components/dashboard/top-navbar";
import { FloatingAIOrb } from "@/components/dashboard/floating-ai-orb";
import { verifyBudgetAuditChain } from "@/lib/currency/budget-audit-compare";
import { getUsdToForeignRates } from "@/lib/currency/exchange-rates";
import { canonicalLeadListingUrl, canonicalLeadProjectTitle } from "@/lib/leads/canonical-lead-display";
import { isImportedLeadRow } from "@/lib/leads/source-filters";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { LeadRow } from "@/types/database";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Budget audit (imports)",
};

function metaRecord(row: LeadRow): Record<string, unknown> {
  return row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata)
    ? (row.metadata as Record<string, unknown>)
    : {};
}

function sourceLabel(row: LeadRow): string {
  const m = metaRecord(row);
  const s = typeof m.source === "string" ? m.source.trim() : "";
  return s || row.platform || "—";
}

function mismatchOrReason(
  ev: ReturnType<typeof verifyBudgetAuditChain>,
): string {
  if (ev.midpointMatchesAverage === false) return "Range midpoint ≠ stored average";
  return ev.lowConfidenceReason ?? ev.auditNote ?? "—";
}

export default async function BudgetAuditPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: leadRows }] = await Promise.all([
    supabase.from("profiles").select("preferred_currency").eq("id", user.id).maybeSingle(),
    supabase
      .from("leads")
      .select("*")
      .is("deleted_at", null)
      .is("archived_at", null)
      .not("metadata->>import_external_id", "is", null)
      .order("updated_at", { ascending: false })
      .limit(500),
  ]);

  const preferred =
    typeof profile?.preferred_currency === "string" && profile.preferred_currency.trim()
      ? profile.preferred_currency.trim()
      : "USD";

  let usdToForeignRates: Record<string, number> | null = null;
  try {
    usdToForeignRates = await getUsdToForeignRates();
  } catch {
    usdToForeignRates = null;
  }

  const rows = ((leadRows ?? []) as LeadRow[]).filter(isImportedLeadRow);
  const audited = rows.map((r) => ({ row: r, ev: verifyBudgetAuditChain(r, preferred, usdToForeignRates) }));

  return (
    <div className="gradient-mesh flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <TopNavbar title="Budget audit" subtitle="Imported leads — internal evidence" displayCurrency={preferred} />
        <main className="flex-1 overflow-y-auto p-3 pb-10 sm:p-6">
          <div className="mx-auto max-w-[1200px] space-y-4">
            <Link
              href="/settings"
              className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to settings
            </Link>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Raw source fields, canonical USD, display conversion, and confidence. Low-confidence budgets are hidden
              from the main app; totals and pipeline sums exclude them.
            </p>
            {audited.length === 0 ? (
              <p className="text-sm text-muted-foreground">No imported leads in this workspace.</p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-border/70 bg-card/40">
                <table className="w-full min-w-[960px] border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-border/60 bg-muted/30 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      <th className="px-2 py-2">Title</th>
                      <th className="px-2 py-2">Source</th>
                      <th className="px-2 py-2">Listing</th>
                      <th className="px-2 py-2 text-right">Min</th>
                      <th className="px-2 py-2 text-right">Max</th>
                      <th className="px-2 py-2">Cur</th>
                      <th className="px-2 py-2 text-right">Src avg</th>
                      <th className="px-2 py-2 text-right">USD</th>
                      <th className="px-2 py-2 text-right">Display</th>
                      <th className="px-2 py-2">Conf</th>
                      <th className="px-2 py-2">Mismatch / note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {audited.map(({ row, ev }) => {
                      const title = canonicalLeadProjectTitle(row).slice(0, 80);
                      const url = canonicalLeadListingUrl(row);
                      return (
                        <tr key={row.id} className="border-b border-border/40 align-top hover:bg-muted/15">
                          <td className="max-w-[180px] px-2 py-2 font-medium text-foreground" title={title}>
                            {title}
                          </td>
                          <td className="whitespace-nowrap px-2 py-2 text-muted-foreground">{sourceLabel(row)}</td>
                          <td className="max-w-[140px] px-2 py-2">
                            {url ? (
                              <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="break-all text-primary underline-offset-2 hover:underline"
                              >
                                link
                              </a>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td className="whitespace-nowrap px-2 py-2 text-right tabular-nums text-muted-foreground">
                            {ev.sourceMin ?? "—"}
                          </td>
                          <td className="whitespace-nowrap px-2 py-2 text-right tabular-nums text-muted-foreground">
                            {ev.sourceMax ?? "—"}
                          </td>
                          <td className="whitespace-nowrap px-2 py-2 text-muted-foreground">{ev.sourceCurrency ?? "—"}</td>
                          <td className="whitespace-nowrap px-2 py-2 text-right tabular-nums text-muted-foreground">
                            {ev.sourceAverageInCurrency ?? "—"}
                          </td>
                          <td className="whitespace-nowrap px-2 py-2 text-right tabular-nums">
                            {ev.canonicalBudgetUsd != null ? ev.canonicalBudgetUsd.toFixed(2) : "—"}
                          </td>
                          <td className="whitespace-nowrap px-2 py-2 text-right tabular-nums text-muted-foreground">
                            {ev.displayedPreferredLabel ?? "—"}
                          </td>
                          <td className="whitespace-nowrap px-2 py-2 uppercase text-muted-foreground">{ev.confidence}</td>
                          <td className="max-w-[220px] px-2 py-2 text-muted-foreground">{mismatchOrReason(ev)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
      <FloatingAIOrb />
    </div>
  );
}
