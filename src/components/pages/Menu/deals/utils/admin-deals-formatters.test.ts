import { describe, expect, it } from "vitest";

import {
  formatDealDate,
  formatDealPrice,
  formatUsageLimit,
  fromDateTimeLocalValue,
  getDealRequiredQuantityLabel,
  getDealSelectedCountLabel,
  getDealLifecycleLabel,
  getDealTypeLabel,
  toDateTimeLocalValue,
} from "@/components/pages/Menu/deals/utils/admin-deals-formatters";

describe("admin deal formatters", () => {
  it("formats price values", () => {
    expect(formatDealPrice(12)).toContain("12");
    expect(formatDealPrice(null)).toBe("—");
  });

  it("formats dates and falls back for invalid dates", () => {
    expect(formatDealDate("invalid")).toBe("—");
    expect(formatDealDate("2026-06-02T06:17:00.000Z")).not.toBe("—");
  });

  it("converts ISO to datetime-local value", () => {
    expect(toDateTimeLocalValue("2026-06-02T06:17:00.000Z")).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/
    );
    expect(toDateTimeLocalValue("invalid")).toBe("");
  });

  it("converts datetime-local value to ISO", () => {
    expect(fromDateTimeLocalValue("2026-06-02T06:17")).toBe(
      new Date("2026-06-02T06:17").toISOString()
    );
    expect(fromDateTimeLocalValue("invalid")).toBe("");
  });

  it("formats usage fallback", () => {
    expect(formatUsageLimit(undefined)).toBe("Unlimited");
    expect(formatUsageLimit(10)).toBe("10");
  });

  it("formats lifecycle labels", () => {
    expect(getDealLifecycleLabel("NO_SHOW")).toBe("No Show");
    expect(getDealLifecycleLabel("scheduled")).toBe("Scheduled");
    expect(getDealLifecycleLabel(undefined)).toBe("Unknown");
  });

  it("formats deal type labels", () => {
    expect(getDealTypeLabel({ dealSelectionMode: "FIXED_ITEMS" })).toBe("Fixed Items");
    expect(getDealTypeLabel({ dealSelectionMode: "FLEXIBLE_ITEMS" })).toBe("Flexible Any-N Items");
    expect(
      getDealTypeLabel({
        dealSelectionMode: "FLEXIBLE_ITEMS",
        scopeCategoryIds: ["category-1"],
      })
    ).toBe("Flexible Any-N Categories");
  });

  it("formats selected count labels", () => {
    expect(getDealSelectedCountLabel({ scopeMenuItemIds: ["item-1", "item-2"] })).toBe("2 items");
    expect(getDealSelectedCountLabel({ scopeCategoryIds: ["category-1"] })).toBe("1 category");
  });

  it("formats required quantity labels", () => {
    expect(
      getDealRequiredQuantityLabel({
        dealSelectionMode: "FLEXIBLE_ITEMS",
        dealRequiredQuantity: 2,
      })
    ).toBe("2");
    expect(getDealRequiredQuantityLabel({ dealSelectionMode: "FIXED_ITEMS" })).toBe("—");
  });
});
