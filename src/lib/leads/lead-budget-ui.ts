import { convertUsdToDisplayCurrency, formatCurrencyAmount } from "@/lib/currency/display-currency";
import { leadBudgetDisplayFromMetadata, leadBudgetFallback, type BudgetType } from "@/lib/leads/budget-display";
import { isSupportedDisplayCurrency, type SupportedDisplayCurrency } from "@/types/currency";
import type { LeadRow } from "@/types/database";

export function computeLeadBudgetUiLine(
  row: LeadRow,
  preferredCurrency?: string | null,
  usdToForeignRates?: Record<string, number> | null,
): { label: string; show: boolean; kind: BudgetType } {
  const meta =
    row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata)
      ? (row.metadata as Record<string, unknown>)
      : {};
  const budgetMeta = leadBudgetDisplayFromMetadata(meta);
  const budgetFallback = leadBudgetFallback(row.budget, row.platform);
  let label = budgetMeta.hide ? (budgetFallback.hide ? "" : budgetFallback.label) : budgetMeta.label;
  let kind: BudgetType = budgetMeta.hide ? budgetFallback.kind : budgetMeta.kind;

  const prefRaw = preferredCurrency ?? "USD";
  const pref: SupportedDisplayCurrency = isSupportedDisplayCurrency(prefRaw) ? prefRaw : "USD";
  const rates = usdToForeignRates;
  if (typeof row.budget_usd === "number" && Number.isFinite(row.budget_usd) && rates && Object.keys(rates).length > 0) {
    const local = convertUsdToDisplayCurrency(row.budget_usd, pref, rates);
    label = formatCurrencyAmount(local, pref);
    const imp =
      meta.import && typeof meta.import === "object" && !Array.isArray(meta.import) ? (meta.import as Record<string, unknown>) : null;
    const bt = typeof imp?.budget_type === "string" ? imp.budget_type.toLowerCase() : "";
    if (bt === "hourly" || bt === "fixed") {
      kind = bt;
    }
  }

  return { label, show: label.length > 0, kind };
}
