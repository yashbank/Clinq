import {
  convertUsdToDisplayCurrency,
  formatCurrencyAmount,
  mergeUsdToForeignRates,
} from "@/lib/currency/display-currency";

describe("display-currency", () => {
  it("converts USD to EUR using USD-base rate", () => {
    const rates = { EUR: 0.91 };
    expect(convertUsdToDisplayCurrency(100, "EUR", rates)).toBeCloseTo(91, 2);
  });

  it("formats USD", () => {
    const s = formatCurrencyAmount(1234.5, "USD");
    expect(s).toMatch(/\$1,?235/);
  });

  it("mergeUsdToForeignRates overlays live rates on fallbacks", () => {
    const merged = mergeUsdToForeignRates({ EUR: 0.88 });
    expect(merged.EUR).toBe(0.88);
    expect(merged.GBP).toBeDefined();
  });
});
