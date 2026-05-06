import "server-only";

import { averageBudgetAmount } from "@/lib/currency/budget-math";
import { convertAmountToUsd } from "@/lib/currency/exchange-rates";

export type LeadBudgetColumns = {
  budget_min: number | null;
  budget_max: number | null;
  budget_avg: number | null;
  currency_original: string | null;
  budget_usd: number | null;
};

export async function resolveLeadBudgetColumnsFromImportMetadata(
  metadataExtra: Record<string, unknown> | undefined,
): Promise<LeadBudgetColumns> {
  const empty: LeadBudgetColumns = {
    budget_min: null,
    budget_max: null,
    budget_avg: null,
    currency_original: null,
    budget_usd: null,
  };
  if (!metadataExtra || typeof metadataExtra !== "object") return empty;

  const imp = metadataExtra.import;
  if (!imp || typeof imp !== "object" || Array.isArray(imp)) return empty;

  const r = imp as Record<string, unknown>;
  const min = typeof r.budget_min === "number" && Number.isFinite(r.budget_min) ? r.budget_min : null;
  const max = typeof r.budget_max === "number" && Number.isFinite(r.budget_max) ? r.budget_max : null;
  const curRaw = typeof r.currency_code === "string" ? r.currency_code.trim().toUpperCase() : "";
  const currency = curRaw.length === 3 ? curRaw : "USD";

  const budget_avg = averageBudgetAmount(min, max);
  if (budget_avg == null) {
    return { ...empty, budget_min: min, budget_max: max, currency_original: curRaw || null };
  }

  let budget_usd: number | null = null;
  try {
    budget_usd = await convertAmountToUsd(budget_avg, currency);
  } catch {
    budget_usd = null;
  }

  return {
    budget_min: min,
    budget_max: max,
    budget_avg,
    currency_original: currency,
    budget_usd,
  };
}
