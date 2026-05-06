import "server-only";

import { averageBudgetAmount } from "@/lib/currency/budget-math";
import { extractImportBudgetFields } from "@/lib/currency/import-budget-fields";
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

  const { min, max, currency } = extractImportBudgetFields(metadataExtra);
  if (min == null && max == null) return empty;

  const budget_avg = averageBudgetAmount(min, max);
  if (budget_avg == null) {
    return { ...empty, budget_min: min, budget_max: max, currency_original: currency };
  }

  if (!currency) {
    return {
      budget_min: min,
      budget_max: max,
      budget_avg,
      currency_original: null,
      budget_usd: null,
    };
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
