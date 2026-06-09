import { describe, expect, it } from "vitest";

import { orderStatusUpdateSchema } from "@/validations/orders";

describe("order status validation", () => {
  it("requires status", () => {
    expect(orderStatusUpdateSchema.safeParse({ status: "" }).success).toBe(false);
  });

  it("allows optional deliveryOtp", () => {
    expect(orderStatusUpdateSchema.safeParse({ status: "PLACED" }).success).toBe(true);
    expect(
      orderStatusUpdateSchema.safeParse({
        status: "PLACED",
        deliveryOtp: "1234",
      }).success
    ).toBe(true);
  });

  it("allows optional acceptance date and time fields", () => {
    expect(
      orderStatusUpdateSchema.safeParse({
        status: "CONFIRMED",
        orderDate: "2026-06-09",
        orderTimeClock: "12:30",
      }).success
    ).toBe(true);
  });
});
