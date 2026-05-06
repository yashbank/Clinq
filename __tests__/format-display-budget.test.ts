import { formatFixedBudgetCompact } from "@/lib/currency/format-display-budget";

describe("formatFixedBudgetCompact", () => {
  it("uses full INR formatting under 10L, not k suffix", () => {
    const s = formatFixedBudgetCompact(7000, "INR");
    expect(s).not.toMatch(/k$/i);
    expect(s).toContain("7");
  });
});
