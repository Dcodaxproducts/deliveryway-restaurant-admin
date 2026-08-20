import { describe, expect, it } from "vitest";

import { formatPaymentStatusLabel } from "./payment-status-label";

describe("formatPaymentStatusLabel", () => {
  it.each(["STRIPE", "PAYPAL"])(
    "labels %s payments as online paid",
    (method) => {
      expect(formatPaymentStatusLabel("PAID", method)).toBe("ONLINE PAID");
    },
  );

  it("keeps non-online paid methods as paid", () => {
    expect(formatPaymentStatusLabel("PAID", "COD")).toBe("PAID");
  });
});
