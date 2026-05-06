import { convertUsdToDisplayCurrency, formatCurrencyAmount } from "@/lib/currency/display-currency";

describe("display-currency", () => {
  it("converts USD to EUR using USD-base rate", () => {
    const rates = { EUR: 0.91 };
    expect(convertUsdToDisplayCurrency(100, "EUR", rates)).toBeCloseTo(91, 2);
  });

  it("formats USD", () => {
    const s = formatCurrencyAmount(1234.5, "USD");
    expect(s).toMatch(/\$1,?235/);
  });
});
