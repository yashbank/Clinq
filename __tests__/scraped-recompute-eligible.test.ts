import { SCRAPED_PROMOTE_THRESHOLD, wasScrapedRowAlreadyPromoteEligible } from "@/lib/leads/scraped-relevance-v2";

describe("wasScrapedRowAlreadyPromoteEligible", () => {
  it("detects prior Eligible skip copy", () => {
    expect(
      wasScrapedRowAlreadyPromoteEligible({
        relevanceScore: 30,
        skipReason: "Eligible (relevance 72) — use Promote",
        supportsRelevance: true,
      }),
    ).toBe(true);
  });

  it("treats stored score at or above threshold as already eligible when column exists", () => {
    expect(
      wasScrapedRowAlreadyPromoteEligible({
        relevanceScore: SCRAPED_PROMOTE_THRESHOLD,
        skipReason: "Relevance 48/100",
        supportsRelevance: true,
      }),
    ).toBe(true);
  });

  it("does not treat score alone when relevance column is unavailable", () => {
    expect(
      wasScrapedRowAlreadyPromoteEligible({
        relevanceScore: 90,
        skipReason: "Pending",
        supportsRelevance: false,
      }),
    ).toBe(false);
  });

  it("returns false for fresh low-score rows", () => {
    expect(
      wasScrapedRowAlreadyPromoteEligible({
        relevanceScore: 12,
        skipReason: "Relevance 12/100",
        supportsRelevance: true,
      }),
    ).toBe(false);
  });
});
