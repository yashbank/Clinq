import { averageBudgetAmount } from "@/lib/currency/budget-math";
import {
  convertUsdToDisplayCurrency,
  formatCurrencyAmount,
  mergeUsdToForeignRates,
} from "@/lib/currency/display-currency";
import { freelancerImportedBudgetTrustLockReason } from "@/lib/currency/freelancer-budget-trust-lock";
import { extractImportBudgetFields } from "@/lib/currency/import-budget-fields";
import { formatBudgetUsdForDisplay } from "@/lib/currency/format-display-budget";
import { isLikelyMisstoredForeignAvgAsUsd, resolveEffectiveBudgetUsd } from "@/lib/leads/effective-budget-usd";
import { leadBudgetDisplayFromMetadata, leadBudgetFallback } from "@/lib/leads/budget-display";
import { isImportedLeadRow } from "@/lib/leads/source-filters";
import { isSupportedDisplayCurrency, type SupportedDisplayCurrency } from "@/types/currency";
import type { LeadRow } from "@/types/database";

export type BudgetConfidence = "high" | "medium" | "low";

export const BUDGET_UNAVAILABLE_LABEL = "Budget unavailable";

export type BudgetEvidenceSnapshot = {
  sourceMin: number | null;
  sourceMax: number | null;
  sourceCurrency: string | null;
  /** Midpoint from source min/max when both exist; else column average when present. */
  sourceAverageInCurrency: number | null;
  canonicalBudgetUsd: number | null;
  displayedPreferredAmount: number | null;
  displayedPreferredLabel: string | null;
  confidence: BudgetConfidence;
  /** Only when `confidence === "low"` — unsafe to show a number in main UI. */
  lowConfidenceReason: string | null;
  /** Optional audit note (e.g. healed mis-stored USD); not a trust failure. */
  auditNote: string | null;
};

function metaRecord(row: LeadRow): Record<string, unknown> {
  return row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata)
    ? (row.metadata as Record<string, unknown>)
    : {};
}

function budgetKindForEvidence(row: LeadRow, meta: Record<string, unknown>): "fixed" | "hourly" | "unknown" {
  const budgetMeta = leadBudgetDisplayFromMetadata(meta);
  if (!budgetMeta.hide) return budgetMeta.kind;
  return leadBudgetFallback(row.budget, row.platform).kind;
}

function hasFxFor(currency: string, merged: Record<string, number>): boolean {
  const c = currency.trim().toUpperCase();
  if (c === "USD") return true;
  const r = merged[c];
  return typeof r === "number" && Number.isFinite(r) && r > 0;
}

/**
 * Deterministic budget confidence + evidence for audit UI and gating.
 * Imported leads use stricter rules; manual leads trust canonical USD resolution when unambiguous.
 */
export function buildBudgetEvidence(
  row: LeadRow,
  preferredCurrency: string | null | undefined,
  usdToForeignRates: Record<string, number> | null | undefined,
): BudgetEvidenceSnapshot {
  const meta = metaRecord(row);
  const imp = extractImportBudgetFields(meta);
  const colMin = typeof row.budget_min === "number" && Number.isFinite(row.budget_min) ? row.budget_min : null;
  const colMax = typeof row.budget_max === "number" && Number.isFinite(row.budget_max) ? row.budget_max : null;
  const colAvg = typeof row.budget_avg === "number" && Number.isFinite(row.budget_avg) && row.budget_avg > 0 ? row.budget_avg : null;
  const colCur =
    typeof row.currency_original === "string" && row.currency_original.trim()
      ? row.currency_original.trim().toUpperCase()
      : null;

  const sourceMin = imp.min ?? colMin;
  const sourceMax = imp.max ?? colMax;
  const sourceCurrency = imp.currency ?? colCur ?? null;

  const fromRange = averageBudgetAmount(imp.min ?? null, imp.max ?? null);
  const sourceAverageInCurrency =
    fromRange != null
      ? fromRange
      : colAvg != null
        ? colAvg
        : averageBudgetAmount(colMin, colMax);

  const prefRaw = preferredCurrency ?? "USD";
  const pref: SupportedDisplayCurrency = isSupportedDisplayCurrency(prefRaw) ? prefRaw : "USD";
  const mergedFx = mergeUsdToForeignRates(usdToForeignRates);

  const canonicalBudgetUsd = resolveEffectiveBudgetUsd(row, mergedFx);
  const kind = budgetKindForEvidence(row, meta);
  const kindForFmt = kind === "hourly" ? "hourly" : "fixed";

  let displayedPreferredAmount: number | null = null;
  let displayedPreferredLabel: string | null = null;
  if (canonicalBudgetUsd != null && canonicalBudgetUsd > 0) {
    displayedPreferredAmount = Math.round(convertUsdToDisplayCurrency(canonicalBudgetUsd, pref, mergedFx) * 100) / 100;
    const fd = formatBudgetUsdForDisplay(canonicalBudgetUsd, pref, usdToForeignRates, kindForFmt);
    displayedPreferredLabel = fd.show ? fd.label : formatCurrencyAmount(displayedPreferredAmount, pref);
  }

  const trustLockReason = freelancerImportedBudgetTrustLockReason(row, meta, {
    sourceCurrency,
    columnCurrencyOriginal: colCur,
    sourceAverageInCurrency,
    sourceMin,
    sourceMax,
    colAvg,
    canonicalBudgetUsd,
    displayedPreferredAmount,
    preferredCurrency: pref,
    mergedFx,
  });
  if (trustLockReason) {
    return {
      sourceMin,
      sourceMax,
      sourceCurrency,
      sourceAverageInCurrency,
      canonicalBudgetUsd: null,
      displayedPreferredAmount: null,
      displayedPreferredLabel: null,
      confidence: "low",
      lowConfidenceReason: trustLockReason,
      auditNote: null,
    };
  }

  const imported = isImportedLeadRow(row);

  let confidence: BudgetConfidence = "high";
  let lowConfidenceReason: string | null = null;
  let healedMisstoredUsd = false;

  if (!imported) {
    if (canonicalBudgetUsd != null && canonicalBudgetUsd > 0) {
      confidence = "high";
    } else if (typeof row.budget === "number" && row.budget > 0 && Number.isFinite(row.budget)) {
      const foreignHint =
        (colCur && colCur !== "USD") ||
        (imp.currency && imp.currency !== "USD") ||
        (meta.import &&
          typeof meta.import === "object" &&
          !Array.isArray(meta.import) &&
          typeof (meta.import as Record<string, unknown>).currency_code === "string" &&
          String((meta.import as Record<string, unknown>).currency_code)
            .trim()
            .toUpperCase() !== "USD");
      confidence = foreignHint ? "low" : "medium";
      if (confidence === "low") {
        lowConfidenceReason = "Manual lead with foreign-currency hints but no canonical USD.";
      }
    } else {
      confidence = "medium";
      lowConfidenceReason = null;
    }
    return {
      sourceMin,
      sourceMax,
      sourceCurrency,
      sourceAverageInCurrency,
      canonicalBudgetUsd,
      displayedPreferredAmount,
      displayedPreferredLabel,
      confidence,
      lowConfidenceReason,
      auditNote: null,
    };
  }

  // Imported: require ISO currency when any money fields exist
  const hasMoney =
    sourceMin != null ||
    sourceMax != null ||
    colAvg != null ||
    (typeof row.budget_usd === "number" && row.budget_usd > 0) ||
    (typeof row.budget === "number" && row.budget > 0);

  if (hasMoney && !sourceCurrency) {
    return {
      sourceMin,
      sourceMax,
      sourceCurrency: null,
      sourceAverageInCurrency,
      canonicalBudgetUsd,
      displayedPreferredAmount: null,
      displayedPreferredLabel: null,
      confidence: "low",
      lowConfidenceReason: "Imported lead has budget numbers but no ISO currency (import or column).",
      auditNote: null,
    };
  }

  if (
    typeof row.budget_usd === "number" &&
    row.budget_usd > 0 &&
    isLikelyMisstoredForeignAvgAsUsd(row.budget_usd, colAvg, colCur ?? sourceCurrency)
  ) {
    if (!hasFxFor(sourceCurrency ?? "USD", mergedFx) || canonicalBudgetUsd == null) {
      return {
        sourceMin,
        sourceMax,
        sourceCurrency,
        sourceAverageInCurrency,
        canonicalBudgetUsd: null,
        displayedPreferredAmount: null,
        displayedPreferredLabel: null,
        confidence: "low",
        lowConfidenceReason:
          "Stored budget_usd matches foreign average (likely mis-stored as USD) and FX repair is unavailable.",
        auditNote: null,
      };
    }
    confidence = "medium";
    lowConfidenceReason = null;
    healedMisstoredUsd = true;
  }

  if (sourceMin != null && sourceMax != null && colAvg != null) {
    const mid = (sourceMin + sourceMax) / 2;
    const tol = Math.max(1, 0.02 * Math.abs(sourceMax - sourceMin));
    if (Math.abs(mid - colAvg) > tol) {
      return {
        sourceMin,
        sourceMax,
        sourceCurrency,
        sourceAverageInCurrency,
        canonicalBudgetUsd,
        displayedPreferredAmount: null,
        displayedPreferredLabel: null,
        confidence: "low",
        lowConfidenceReason: "Column budget_avg conflicts with source min/max midpoint beyond tolerance.",
        auditNote: null,
      };
    }
  }

  if (canonicalBudgetUsd == null || canonicalBudgetUsd <= 0) {
    return {
      sourceMin,
      sourceMax,
      sourceCurrency,
      sourceAverageInCurrency,
      canonicalBudgetUsd: null,
      displayedPreferredAmount: null,
      displayedPreferredLabel: null,
      confidence: "low",
      lowConfidenceReason: "Could not resolve canonical USD from stored fields and FX.",
      auditNote: null,
    };
  }

  const auditNote: string | null = healedMisstoredUsd
    ? "Stored budget_usd matched foreign average; display uses recomputed USD from average + FX (consider backfill)."
    : null;

  if (sourceCurrency && sourceMin != null && sourceMax != null) {
    confidence = confidence === "medium" ? "medium" : "high";
  } else if (sourceCurrency && (sourceMin != null || sourceMax != null || colAvg != null)) {
    confidence = "medium";
  }

  const trustLockFinal = freelancerImportedBudgetTrustLockReason(row, meta, {
    sourceCurrency,
    columnCurrencyOriginal: colCur,
    sourceAverageInCurrency,
    sourceMin,
    sourceMax,
    colAvg,
    canonicalBudgetUsd,
    displayedPreferredAmount,
    preferredCurrency: pref,
    mergedFx,
  });
  if (trustLockFinal) {
    return {
      sourceMin,
      sourceMax,
      sourceCurrency,
      sourceAverageInCurrency,
      canonicalBudgetUsd: null,
      displayedPreferredAmount: null,
      displayedPreferredLabel: null,
      confidence: "low",
      lowConfidenceReason: trustLockFinal,
      auditNote: null,
    };
  }

  return {
    sourceMin,
    sourceMax,
    sourceCurrency,
    sourceAverageInCurrency,
    canonicalBudgetUsd,
    displayedPreferredAmount,
    displayedPreferredLabel,
    confidence,
    lowConfidenceReason: null,
    auditNote,
  };
}

/** Canonical USD for sums; excludes low-confidence imported amounts. */
export function resolveTrustedBudgetUsd(
  row: Pick<LeadRow, "budget" | "budget_usd" | "budget_avg" | "budget_min" | "budget_max" | "currency_original" | "metadata">,
  usdToForeignRates: Record<string, number> | null | undefined,
): number | null {
  const ev = buildBudgetEvidence(row as LeadRow, "USD", usdToForeignRates);
  if (ev.confidence === "low") return null;
  return ev.canonicalBudgetUsd;
}

/**
 * Compare source range, midpoint, USD, and display for tests and audit tooling.
 */
export function compareBudgetAuditDimensions(ev: BudgetEvidenceSnapshot): {
  rangeSpan: number | null;
  midpointMatchesAverage: boolean | null;
  usdFromCanonical: number | null;
  displayAmount: number | null;
} {
  const span =
    ev.sourceMin != null && ev.sourceMax != null ? Math.round((ev.sourceMax - ev.sourceMin) * 100) / 100 : null;
  let midpointMatchesAverage: boolean | null = null;
  if (ev.sourceMin != null && ev.sourceMax != null && ev.sourceAverageInCurrency != null) {
    const mid = (ev.sourceMin + ev.sourceMax) / 2;
    midpointMatchesAverage = Math.abs(mid - ev.sourceAverageInCurrency) < 0.06;
  }
  return {
    rangeSpan: span,
    midpointMatchesAverage,
    usdFromCanonical: ev.canonicalBudgetUsd,
    displayAmount: ev.displayedPreferredAmount,
  };
}
