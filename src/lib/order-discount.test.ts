import { describe, expect, it } from "vitest";

import { resolveAppliedOrderCoupon } from "@/lib/order-discount";

describe("resolveAppliedOrderCoupon", () => {
  it.each([
    ["current normal delivery", { orderType: "DELIVERY", isGroupOrder: false }],
    ["historical group pickup", { orderType: "TAKEAWAY", isGroupOrder: true }],
  ])("keeps a valid coupon and discount visible for %s orders", (_, context) => {
      expect(
        resolveAppliedOrderCoupon({
          ...context,
          coupon: { id: "coupon-1", code: " SAVE10 ", title: "Ten off" },
          discountAmount: 10,
        }),
      ).toEqual({
        id: "coupon-1",
        code: "SAVE10",
        title: "Ten off",
        discountAmount: 10,
      });
  });

  it.each([
    { coupon: null, discountAmount: 0 },
    { coupon: { code: "" }, discountAmount: 10 },
    { coupon: { code: "SAVE10" }, discountAmount: 0 },
    { coupon: { code: "SAVE10" }, discountAmount: Number.NaN },
  ])("does not expose incomplete coupon data", (order) => {
    expect(resolveAppliedOrderCoupon(order)).toBeNull();
  });
});
