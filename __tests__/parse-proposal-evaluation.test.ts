import { parseProposalEvaluation } from "@/lib/proposal/parse-evaluation";

describe("parseProposalEvaluation", () => {
  it("fills missing numeric scores with safe defaults", () => {
    const r = parseProposalEvaluation({
      personalization: "not-a-number",
      clarity: 80,
      model: "gpt-test",
      evaluatedAt: "2026-01-01T00:00:00Z",
      tone: "friendly",
      mode: "short",
    });
    expect(r).not.toBeNull();
    expect(r!.personalization).toBe(50);
    expect(r!.clarity).toBe(80);
    expect(r!.notes.length).toBeGreaterThan(0);
  });

  it("returns a usable record when only overall is present", () => {
    const r = parseProposalEvaluation({
      overall: 72,
      model: "m",
      evaluatedAt: "2026-01-02T00:00:00Z",
      tone: "consultative",
      mode: "long",
    });
    expect(r!.overall).toBe(72);
    expect(r!.relevance).toBe(50);
    expect(r!.trust).toBe(50);
  });
});
