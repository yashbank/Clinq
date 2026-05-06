import { compareBudgetAuditDimensions, verifyBudgetAuditChain } from "@/lib/currency/budget-audit-compare";
import {
  BUDGET_UNAVAILABLE_LABEL,
  buildBudgetEvidence,
  resolveTrustedBudgetUsd,
} from "@/lib/currency/budget-evidence";
import { computeLeadBudgetUiLine } from "@/lib/leads/lead-budget-ui";
import type { LeadRow } from "@/types/database";

const rates = { EUR: 0.92, GBP: 0.79, INR: 84, CAD: 1.36 };

function baseRow(p: Partial<LeadRow> & { metadata?: Record<string, unknown> }): LeadRow {
  const now = new Date().toISOString();
  return {
    id: "00000000-0000-4000-8000-000000000001",
    user_id: "u",
    client_name: "c",
    platform: "Freelancer",
    project_description: "d",
    budget: null,
    score: 50,
    stage: "saved",
    email: null,
    phone: null,
    company: null,
    repeat_hire: false,
    competition_level: 2,
    project_quality: 3,
    client_history: null,
    proposal_match_notes: null,
    metadata: { import_external_id: "ext-1" },
    created_at: now,
    updated_at: now,
    ...p,
  } as LeadRow;
}

describe("buildBudgetEvidence / trust", () => {
  it("Freelancer-style INR range midpoint is 7000 for 1500–12500", () => {
    const row = baseRow({
      budget_min: 1500,
      budget_max: 12500,
      budget_avg: 7000,
      currency_original: "INR",
      budget_usd: 83.33,
      metadata: {
        import_external_id: "job-1",
        import: { budget_min: 1500, budget_max: 12500, currency_code: "INR" },
      },
    });
    const ev = buildBudgetEvidence(row, "INR", rates);
    expect(ev.sourceAverageInCurrency).toBe(7000);
    const cmp = compareBudgetAuditDimensions(ev);
    expect(cmp.midpointMatchesAverage).toBe(true);
  });

  it("INR range → USD normalization → INR display roundtrip (approx)", () => {
    const row = baseRow({
      budget_min: 1500,
      budget_max: 12500,
      budget_avg: 7000,
      currency_original: "INR",
      budget_usd: 83.33,
      metadata: {
        import_external_id: "job-2",
        import: { budget_min: 1500, budget_max: 12500, currency_code: "INR" },
      },
    });
    const ev = buildBudgetEvidence(row, "INR", rates);
    expect(ev.confidence).not.toBe("low");
    expect(ev.canonicalBudgetUsd).toBeCloseTo(7000 / 84, 1);
    expect(ev.displayedPreferredAmount).toBeCloseTo(7000, -1);
  });

  it("recovers ISO currency from raw_snapshot when import currency_code missing", () => {
    const row = baseRow({
      budget_min: 100,
      budget_max: 200,
      budget_avg: 150,
      currency_original: null,
      budget_usd: null,
      metadata: {
        import_external_id: "job-3",
        import: {
          budget_min: 100,
          budget_max: 200,
          raw_snapshot: { currency_code: "INR" },
        },
      },
    });
    const ev = buildBudgetEvidence(row, "USD", rates);
    expect(ev.sourceCurrency).toBe("INR");
    expect(ev.confidence).not.toBe("low");
    expect(ev.canonicalBudgetUsd).toBeCloseTo(150 / 84, 1);
  });

  it("low-confidence conflicting avg hides budget in main UI and excludes from trusted USD sum", () => {
    const row = baseRow({
      budget_min: 1500,
      budget_max: 12500,
      budget_avg: 9999,
      currency_original: "INR",
      budget_usd: null,
      metadata: {
        import_external_id: "job-4",
        import: { budget_min: 1500, budget_max: 12500, currency_code: "INR" },
      },
    });
    const ev = buildBudgetEvidence(row, "INR", rates);
    expect(ev.confidence).toBe("low");
    expect(resolveTrustedBudgetUsd(row, rates)).toBeNull();
    const ui = computeLeadBudgetUiLine(row, "INR", rates);
    expect(ui.label).toBe(BUDGET_UNAVAILABLE_LABEL);
    expect(ui.show).toBe(true);
  });

  it("verifyBudgetAuditChain merges comparison dimensions", () => {
    const row = baseRow({
      budget_min: 1500,
      budget_max: 12500,
      budget_avg: 7000,
      currency_original: "INR",
      budget_usd: 83.33,
      metadata: {
        import_external_id: "job-5",
        import: { budget_min: 1500, budget_max: 12500, currency_code: "INR" },
      },
    });
    const v = verifyBudgetAuditChain(row, "INR", rates);
    expect(v.rangeSpan).toBe(11000);
    expect(v.usdFromCanonical).toBe(v.canonicalBudgetUsd);
  });
});
