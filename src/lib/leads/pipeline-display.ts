import { canonicalLeadProjectTitle, canonicalLeadSummaryLine } from "@/lib/leads/canonical-lead-display";
import { computeLeadBudgetUiLine } from "@/lib/leads/lead-budget-ui";
import type { LeadRow } from "@/types/database";

/** Canonical project headline for pipeline cards. */
export function leadKanbanTitle(row: LeadRow): string {
  return canonicalLeadProjectTitle(row);
}

export function leadKanbanSummary(row: LeadRow): string {
  return canonicalLeadSummaryLine(row).slice(0, 220);
}

export function leadKanbanBudgetLine(
  row: LeadRow,
  currency?: { preferredCurrency: string; usdToForeignRates: Record<string, number> | null },
): {
  label: string;
  show: boolean;
  kind: "fixed" | "hourly" | "unknown";
} {
  return computeLeadBudgetUiLine(row, currency?.preferredCurrency ?? null, currency?.usdToForeignRates ?? null);
}
