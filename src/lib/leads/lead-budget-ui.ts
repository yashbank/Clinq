import { formatBudgetUsdForDisplay } from "@/lib/currency/format-display-budget";
import { leadBudgetDisplayFromMetadata, leadBudgetFallback, type BudgetType } from "@/lib/leads/budget-display";
import { resolveEffectiveBudgetUsd } from "@/lib/leads/effective-budget-usd";
import { isSupportedDisplayCurrency, type SupportedDisplayCurrency } from "@/types/currency";
import type { LeadRow } from "@/types/database";

function budgetKindFromRow(row: LeadRow, meta: Record<string, unknown>): "fixed" | "hourly" | "unknown" {
  const budgetMeta = leadBudgetDisplayFromMetadata(meta);
  if (!budgetMeta.hide) return budgetMeta.kind;
  const fb = leadBudgetFallback(row.budget, row.platform);
  return fb.kind;
}

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
  const kind = budgetKindFromRow(row, meta);

  const prefRaw = preferredCurrency ?? "USD";
  const pref: SupportedDisplayCurrency = isSupportedDisplayCurrency(prefRaw) ? prefRaw : "USD";
  const rates = usdToForeignRates;

  const usd = resolveEffectiveBudgetUsd(row, rates);

  if (usd !== null && rates && Object.keys(rates).length > 0) {
    const fd = formatBudgetUsdForDisplay(usd, pref, rates, kind === "hourly" ? "hourly" : "fixed");
    if (fd.show) {
      return { label: fd.label, show: true, kind };
    }
  }

  if (usd !== null && (!rates || Object.keys(rates).length === 0) && pref === "USD") {
    const fd = formatBudgetUsdForDisplay(usd, "USD", null, kind === "hourly" ? "hourly" : "fixed");
    if (fd.show) return { label: fd.label, show: true, kind };
  }

  const label = budgetMeta.hide ? (budgetFallback.hide ? "" : budgetFallback.label) : budgetMeta.label;
  const outKind: BudgetType = budgetMeta.hide ? budgetFallback.kind : budgetMeta.kind;
  return { label, show: label.length > 0, kind: outKind };
}
