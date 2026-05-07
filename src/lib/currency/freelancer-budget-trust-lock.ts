import { freelancerCurrencyIdToIso } from "@/lib/integrations/freelancer/freelancer-currency-ids";
import { foreignAmountToUsd } from "@/lib/leads/effective-budget-usd";
import { isFreelancerImportedLeadRow } from "@/lib/leads/source-filters";
import type { LeadRow } from "@/types/database";

function importBlock(meta: Record<string, unknown>): Record<string, unknown> | null {
  const imp = meta.import;
  if (!imp || typeof imp !== "object" || Array.isArray(imp)) return null;
  return imp as Record<string, unknown>;
}

/** Parsed `metadata.import.raw_snapshot.currency_id` from Freelancer API (integer). */
export function freelancerRawSnapshotCurrencyId(meta: Record<string, unknown>): number | null {
  const imp = importBlock(meta);
  if (!imp) return null;
  const raw = imp.raw_snapshot;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const v = (raw as Record<string, unknown>).currency_id;
  if (typeof v === "number" && Number.isFinite(v)) return Math.trunc(v);
  if (typeof v === "string" && /^\s*\d+\s*$/.test(v)) return Math.trunc(Number(v.trim()));
  return null;
}

/** True only when Freelancer API snapshot explicitly says USD (currency_id 1). */
export function freelancerUsdListingProvenByApiSnapshot(meta: Record<string, unknown>): boolean {
  return freelancerRawSnapshotCurrencyId(meta) === 1;
}

export type FreelancerTrustLockInputs = {
  sourceCurrency: string | null;
  /** `leads.currency_original` before merge with import extract (detect column vs snapshot mismatch). */
  columnCurrencyOriginal: string | null;
  sourceAverageInCurrency: number | null;
  sourceMin: number | null;
  sourceMax: number | null;
  colAvg: number | null;
  canonicalBudgetUsd: number | null;
  displayedPreferredAmount: number | null;
  preferredCurrency: string;
  mergedFx: Record<string, number>;
};

/**
 * If non-null, the Freelancer import budget must be treated as LOW confidence:
 * hidden in main UI, excluded from totals, auditable with this reason.
 */
export function freelancerImportedBudgetTrustLockReason(
  row: Pick<LeadRow, "metadata" | "platform">,
  meta: Record<string, unknown>,
  p: FreelancerTrustLockInputs,
): string | null {
  if (!isFreelancerImportedLeadRow(row as LeadRow)) return null;

  const cur = (p.sourceCurrency ?? "").trim().toUpperCase();
  const avg = p.sourceAverageInCurrency;
  const provenUsd = freelancerUsdListingProvenByApiSnapshot(meta);

  const hasRange = p.sourceMin != null && p.sourceMax != null;
  const weakRange = !hasRange && (avg != null || p.colAvg != null);

  const snapCid = freelancerRawSnapshotCurrencyId(meta);
  const cidIso = snapCid != null ? freelancerCurrencyIdToIso(snapCid) : null;
  const colUsd = (p.columnCurrencyOriginal ?? "").trim().toUpperCase() === "USD";
  /** Only when merged source currency is still USD: import extract may already have corrected the column to INR from snapshot id. */
  if (colUsd && cidIso != null && cidIso !== "USD" && cur === "USD") {
    return "Freelancer import: currency_original is USD but raw_snapshot.currency_id maps to a non-USD API currency — legacy mismatch; budget locked.";
  }

  if (cur === "USD" && avg != null && avg >= 100_000 && !provenUsd) {
    return "Freelancer import: USD cannot be proven (snapshot lacks API currency_id=1). Large averages are often INR-scale values mis-labeled — budget locked.";
  }

  if (cur === "USD" && avg != null && avg >= 35_000 && weakRange && !provenUsd) {
    return "Freelancer import: USD budget with only a large average and no min/max or API currency_id=1 — evidence too weak; budget locked.";
  }

  if (cur && cur !== "USD" && avg != null && avg >= 20_000 && p.canonicalBudgetUsd != null && p.canonicalBudgetUsd > 0) {
    const expectedUsd = foreignAmountToUsd(avg, cur, p.mergedFx);
    if (expectedUsd != null && expectedUsd > 0 && p.canonicalBudgetUsd > expectedUsd * 4) {
      return "Freelancer import: canonical USD is far above what the stored source average implies in the stated currency — likely mixed currencies; budget locked.";
    }
  }

  const pref = (p.preferredCurrency ?? "USD").trim().toUpperCase();
  if (
    pref === "INR" &&
    avg != null &&
    avg >= 25_000 &&
    p.displayedPreferredAmount != null &&
    p.displayedPreferredAmount > avg * 3.5
  ) {
    return "Freelancer import: display in INR is far above the source average — likely an inflated conversion; budget locked.";
  }

  if (
    pref !== "USD" &&
    pref !== "INR" &&
    avg != null &&
    avg >= 20_000 &&
    cur &&
    cur !== "USD" &&
    p.displayedPreferredAmount != null &&
    p.displayedPreferredAmount > avg * 4
  ) {
    return "Freelancer import: converted display is far above the source average in the stated currency — likely a conversion mix-up; budget locked.";
  }

  return null;
}
