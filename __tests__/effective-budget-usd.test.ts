import { resolveEffectiveBudgetUsd } from "@/lib/leads/effective-budget-usd";
import type { LeadRow } from "@/types/database";

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
    metadata: {},
    created_at: now,
    updated_at: now,
    ...p,
  } as LeadRow;
}

const rates = { EUR: 0.92, GBP: 0.79, INR: 84, CAD: 1.36 };

describe("resolveEffectiveBudgetUsd", () => {
  it("uses trusted budget_usd when not a foreign-avg duplicate", () => {
    const usd = resolveEffectiveBudgetUsd(
      baseRow({
        budget_usd: 83.33,
        budget_avg: 7000,
        currency_original: "INR",
        budget_min: 1500,
        budget_max: 12500,
      }),
      rates,
    );
    expect(usd).toBeCloseTo(83.33, 1);
  });

  it("heals mis-stored budget_usd equal to INR average (7000 stored as USD)", () => {
    const healed = resolveEffectiveBudgetUsd(
      baseRow({
        budget_usd: 7000,
        budget_avg: 7000,
        currency_original: "INR",
        budget_min: 1500,
        budget_max: 12500,
      }),
      rates,
    );
    expect(healed).toBeCloseTo(7000 / 84, 2);
  });

  it("reconstructs from import metadata when columns empty", () => {
    const v = resolveEffectiveBudgetUsd(
      baseRow({
        budget_usd: null,
        budget_avg: null,
        currency_original: null,
        metadata: {
          import: {
            budget_min: 1500,
            budget_max: 12500,
            currency_code: "INR",
          },
        },
      }),
      rates,
    );
    expect(v).toBeCloseTo(7000 / 84, 2);
  });

  it("does not treat legacy budget as USD when import currency is INR", () => {
    expect(
      resolveEffectiveBudgetUsd(
        baseRow({
          budget_usd: null,
          budget_avg: null,
          currency_original: null,
          budget: 7000,
          metadata: {
            import: { budget_min: 1500, budget_max: 12500, currency_code: "INR" },
          },
        }),
        rates,
      ),
    ).toBeCloseTo(7000 / 84, 2);
  });

  it("treats legacy budget as USD for manual rows with no foreign hints", () => {
    expect(resolveEffectiveBudgetUsd(baseRow({ budget_usd: null, budget: 5000, metadata: {} }), rates)).toBe(5000);
  });
});
