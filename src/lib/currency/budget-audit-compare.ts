import { buildBudgetEvidence, compareBudgetAuditDimensions, type BudgetEvidenceSnapshot } from "@/lib/currency/budget-evidence";
import type { LeadRow } from "@/types/database";

export { compareBudgetAuditDimensions } from "@/lib/currency/budget-evidence";

/** Single object for audit UI and tests: evidence + range/midpoint/display checks. */
export function verifyBudgetAuditChain(
  row: LeadRow,
  preferredCurrency: string | null | undefined,
  usdToForeignRates: Record<string, number> | null | undefined,
): BudgetEvidenceSnapshot & ReturnType<typeof compareBudgetAuditDimensions> {
  const ev = buildBudgetEvidence(row, preferredCurrency, usdToForeignRates);
  return { ...ev, ...compareBudgetAuditDimensions(ev) };
}
