import { computeLeadRankingV3Score, titleProfileOverlapPct, budgetClaritySignal } from "@/lib/ai/lead-ranking-v3";
import type { LeadRow } from "@/types/database";

function baseLead(over: Partial<LeadRow> = {}): LeadRow {
  const now = "2026-05-01T12:00:00.000Z";
  return {
    id: "00000000-0000-4000-8000-000000000001",
    user_id: "00000000-0000-4000-8000-000000000002",
    client_name: "Acme",
    platform: "freelancer",
    project_description: "Build a react dashboard",
    budget: 500,
    score: 70,
    stage: "saved",
    email: null,
    phone: null,
    company: null,
    repeat_hire: false,
    competition_level: 2,
    project_quality: 3,
    client_history: null,
    proposal_match_notes: null,
    metadata: { project_title: "React dashboard for analytics" },
    created_at: now,
    updated_at: now,
    is_freelancer_channel: true,
    is_imported_lead: true,
    ...over,
  };
}

describe("lead-ranking-v3", () => {
  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-05-01T12:00:00.000Z"));
  });
  afterAll(() => {
    jest.useRealTimers();
  });

  it("titleProfileOverlapPct reflects canonical title vs profile tokens", () => {
    const lead = baseLead();
    expect(titleProfileOverlapPct(lead, ["react", "typescript"])).toBeGreaterThan(40);
    expect(titleProfileOverlapPct(lead, ["kotlin"])).toBe(0);
  });

  it("budgetClaritySignal prefers budget_usd then structured fields", () => {
    expect(budgetClaritySignal(baseLead({ budget_usd: 1200 }), 1200)).toBeGreaterThanOrEqual(90);
    expect(
      budgetClaritySignal(
        baseLead({ budget_usd: null, budget_avg: 500, currency_original: "EUR", budget: null }),
        540,
      ),
    ).toBeGreaterThanOrEqual(80);
  });

  it("computeLeadRankingV3Score is deterministic for identical inputs", () => {
    const a = baseLead({ score: 72, metadata: { project_title: "Node API with postgres" } });
    const opts = {
      profileTokens: ["node", "postgres"],
      skillMatchPct: 55,
      nicheMatchPct: 30,
      effectiveBudgetUsd: 2000,
      hasProposal: false,
    };
    expect(computeLeadRankingV3Score(a, opts)).toBe(computeLeadRankingV3Score(a, opts));
  });

  it("interested status increases score vs neutral", () => {
    const neutral = baseLead({ interest_status: null });
    const interested = baseLead({ interest_status: "interested" });
    const opts = { profileTokens: ["react"], skillMatchPct: 40, nicheMatchPct: 20, effectiveBudgetUsd: 800 };
    expect(computeLeadRankingV3Score(interested, opts)).toBeGreaterThan(computeLeadRankingV3Score(neutral, opts));
  });
});
