import { describe, expect, it } from "vitest";

import { normalizeDecimalInput, parseLocalizedDecimal } from "./decimal";

describe("localized decimals", () => {
  it("allows comma and dot decimal input", () => {
    expect(normalizeDecimalInput("1,5")).toBe("1.5");
    expect(normalizeDecimalInput("3.50")).toBe("3.50");
    expect(parseLocalizedDecimal("1,5")).toBe(1.5);
    expect(parseLocalizedDecimal("3.50")).toBe(3.5);
  });

  it("preserves an incomplete decimal while the user is typing", () => {
    expect(normalizeDecimalInput("1,")).toBe("1.");
  });
});
