import { beforeEach, describe, expect, it } from "vitest";

import {
  FALLBACK_CURRENCY,
  formatMoney,
  getRestaurantSettingsCurrency,
  normalizeCurrency,
  resolveCurrency,
  setGlobalDefaultCurrency,
} from "@/lib/currency";

describe("currency helpers", () => {
  beforeEach(() => {
    setGlobalDefaultCurrency(null);
  });

  it("normalizes ISO currency codes", () => {
    expect(normalizeCurrency("aed")).toBe("AED");
    expect(normalizeCurrency(" usd ")).toBe("USD");
    expect(normalizeCurrency("$")).toBeUndefined();
  });

  it("resolves the first available currency with PKR as final display fallback", () => {
    expect(resolveCurrency(undefined, "eur", "PKR")).toBe("EUR");
    expect(resolveCurrency()).toBe(FALLBACK_CURRENCY);
  });

  it("formats money with the supplied currency", () => {
    expect(formatMoney(12, "AED")).toContain("12");
    expect(formatMoney(12, "usd")).toMatch(/12|US/);
  });

  it("uses the global default currency ahead of local record currencies", () => {
    setGlobalDefaultCurrency("EUR");

    expect(resolveCurrency("USD", "AED")).toBe("EUR");
    expect(formatMoney(12, "USD")).toMatch(/12|€|EUR/);
  });

  it("reads restaurant currency settings in priority order", () => {
    expect(
      getRestaurantSettingsCurrency({
        payments: { currency: "EUR" },
        invoice: { currency: "USD" },
      })
    ).toBe("EUR");

    expect(
      getRestaurantSettingsCurrency({
        currency: "AED",
        payments: { currency: "EUR" },
      })
    ).toBe("AED");
  });
});
