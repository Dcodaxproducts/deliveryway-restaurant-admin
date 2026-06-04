import { describe, expect, it } from "vitest";

import {
  formatGiftCardAmount,
  formatGiftCardCustomerUsage,
  formatGiftCardDate,
  formatGiftCardUsage,
  fromDateTimeLocalValue,
  getGiftCardImageUrl,
  getGiftCardLifecycleLabel,
  getGiftCardStatusLabel,
  toDateTimeLocalValue,
} from "@/components/pages/Promotions/gift-cards/utils/gift-card-formatters";

describe("gift card formatters", () => {
  it("formats amount values", () => {
    expect(formatGiftCardAmount(1000)).toContain("1,000");
    expect(formatGiftCardAmount(null)).toBe("—");
  });

  it("formats lifecycle and status labels", () => {
    expect(getGiftCardLifecycleLabel("NO_SHOW")).toBe("No Show");
    expect(getGiftCardStatusLabel("scheduled")).toBe("Scheduled");
    expect(getGiftCardLifecycleLabel(undefined)).toBe("Unknown");
  });

  it("formats usage values", () => {
    expect(formatGiftCardUsage({ usedCount: 4, maxUses: 10 })).toBe("4 / 10");
    expect(formatGiftCardUsage({ usedCount: undefined, maxUses: null })).toBe(
      "0 / Unlimited"
    );
    expect(formatGiftCardCustomerUsage(null)).toBe("Unlimited");
    expect(formatGiftCardCustomerUsage(2)).toBe("2");
  });

  it("formats dates and falls back for invalid dates", () => {
    expect(formatGiftCardDate("invalid")).toBe("—");
    expect(formatGiftCardDate("2026-06-04T00:00:00.000Z")).not.toBe("—");
  });

  it("converts date values for datetime-local inputs", () => {
    expect(toDateTimeLocalValue("2026-06-04T00:00:00.000Z")).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/
    );
    expect(fromDateTimeLocalValue("2026-06-04T00:00")).toBe(
      new Date("2026-06-04T00:00").toISOString()
    );
  });

  it("prefers thumbnail and falls back to image", () => {
    expect(
      getGiftCardImageUrl({
        thumbnailUrl: " /thumb.png ",
        imageUrl: "/image.png",
      })
    ).toBe("/thumb.png");
    expect(getGiftCardImageUrl({ thumbnailUrl: "", imageUrl: "/image.png" })).toBe(
      "/image.png"
    );
  });
});
