import { freelancerImportedBudgetTrustLockReason, freelancerUsdListingProvenByApiSnapshot } from "@/lib/currency/freelancer-budget-trust-lock";
import type { LeadRow } from "@/types/database";

const mergedFx = { EUR: 0.92, GBP: 0.79, INR: 84, CAD: 1.36 };

function row(meta: Record<string, unknown>): LeadRow {
  const now = new Date().toISOString();
  return {
    id: "00000000-0000-4000-8000-000000000099",
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
    metadata: meta,
    created_at: now,
    updated_at: now,
  } as LeadRow;
}

describe("freelancerImportedBudgetTrustLockReason", () => {
  it("returns reason when USD + large average and snapshot is not API currency_id=1", () => {
    const meta = {
      import_external_id: "freelancer:1",
      source: "freelancer",
      import: {
        provider: "freelancer",
        budget_min: 500_000,
        budget_max: 1_000_000,
        currency_code: "USD",
        raw_snapshot: { budget_min: 500_000, budget_max: 1_000_000 },
      },
    };
    const r = row(meta);
    expect(freelancerUsdListingProvenByApiSnapshot(meta)).toBe(false);
    const reason = freelancerImportedBudgetTrustLockReason(r, meta, {
      sourceCurrency: "USD",
      columnCurrencyOriginal: "USD",
      sourceAverageInCurrency: 750_000,
      sourceMin: 500_000,
      sourceMax: 1_000_000,
      colAvg: 750_000,
      canonicalBudgetUsd: 750_000,
      displayedPreferredAmount: 63_000_000,
      preferredCurrency: "INR",
      mergedFx,
    });
    expect(reason).toContain("USD cannot be proven");
  });

  it("allows USD when snapshot currency_id is 1", () => {
    const meta = {
      import_external_id: "freelancer:2",
      import: { raw_snapshot: { currency_id: 1 } },
    };
    expect(freelancerUsdListingProvenByApiSnapshot(meta)).toBe(true);
    const reason = freelancerImportedBudgetTrustLockReason(row(meta), meta, {
      sourceCurrency: "USD",
      columnCurrencyOriginal: "USD",
      sourceAverageInCurrency: 250_000,
      sourceMin: 100_000,
      sourceMax: 400_000,
      colAvg: 250_000,
      canonicalBudgetUsd: 250_000,
      displayedPreferredAmount: 250_000,
      preferredCurrency: "USD",
      mergedFx,
    });
    expect(reason).toBeNull();
  });

  it("locks when column and merged source are USD but snapshot currency_id maps to INR", () => {
    const meta = {
      import_external_id: "freelancer:3",
      import: { raw_snapshot: { currency_id: 11 } },
    };
    const reason = freelancerImportedBudgetTrustLockReason(row(meta), meta, {
      sourceCurrency: "USD",
      columnCurrencyOriginal: "USD",
      sourceAverageInCurrency: 7000,
      sourceMin: 1500,
      sourceMax: 12500,
      colAvg: 7000,
      canonicalBudgetUsd: 83.33,
      displayedPreferredAmount: 7000,
      preferredCurrency: "INR",
      mergedFx,
    });
    expect(reason).toContain("currency_original is USD");
  });
});
