import { describe, expect, it } from "vitest";

import {
  getNextOrderStatus,
  requiresDeliveryOtpForStatusTransition,
} from "@/lib/order-status-transitions";

describe("order status transitions", () => {
  it("maps PREPARING to the correct next status by order type", () => {
    expect(
      getNextOrderStatus({ orderType: "DELIVERY", status: "PREPARING" })
    ).toBe("OUT_FOR_DELIVERY");
    expect(
      getNextOrderStatus({ orderType: "TAKEAWAY", status: "PREPARING" })
    ).toBe("READY_FOR_PICKUP");
    expect(
      getNextOrderStatus({ orderType: "DINE_IN", status: "PREPARING" })
    ).toBe("READY_TO_SERVE");
  });

  it("returns no next status for terminal statuses", () => {
    expect(
      getNextOrderStatus({ orderType: "DELIVERY", status: "DELIVERED" })
    ).toBeUndefined();
    expect(
      getNextOrderStatus({ orderType: "TAKEAWAY", status: "PICKED_UP" })
    ).toBeUndefined();
    expect(
      getNextOrderStatus({ orderType: "DINE_IN", status: "SERVED" })
    ).toBeUndefined();
  });

  it("requires delivery OTP only when delivering a delivery order", () => {
    expect(
      requiresDeliveryOtpForStatusTransition(
        { orderType: "DELIVERY", status: "OUT_FOR_DELIVERY" },
        "DELIVERED"
      )
    ).toBe(true);
    expect(
      requiresDeliveryOtpForStatusTransition(
        { orderType: "TAKEAWAY", status: "READY_FOR_PICKUP" },
        "PICKED_UP"
      )
    ).toBe(false);
  });
});
