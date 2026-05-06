import { extractImportBudgetFields } from "@/lib/currency/import-budget-fields";

describe("extractImportBudgetFields", () => {
  it("reads currency from raw_snapshot when import.currency_code is missing", () => {
    const meta = {
      import: {
        budget_min: 1500,
        budget_max: 12500,
        raw_snapshot: { currency_code: "INR" },
      },
    };
    expect(extractImportBudgetFields(meta)).toEqual({
      min: 1500,
      max: 12500,
      currency: "INR",
    });
  });

  it("prefers explicit import.currency_code over raw_snapshot", () => {
    const meta = {
      import: {
        budget_min: 1,
        budget_max: 2,
        currency_code: "EUR",
        raw_snapshot: { currency_code: "INR" },
      },
    };
    expect(extractImportBudgetFields(meta).currency).toBe("EUR");
  });

  it("returns null currency when ISO code missing", () => {
    expect(
      extractImportBudgetFields({
        import: { budget_min: 100, budget_max: 200 },
      }).currency,
    ).toBeNull();
  });
});
