import { describe, expect, it } from "vitest";

import {
  canDirectlyUpdateOrderStatus,
  canSendDeliveryOrderOutDirectly,
  canTerminateOrderStatus,
  canUseExternalDeliveryFulfillment,
  getOrderStatusProgressSteps,
  getNextOrderStatus,
  requiresDeliveryOtpForStatusTransition,
  requiresOrderTimeForStatusTransition,
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

  it("requires the popup when accepting an order because order time is needed", () => {
    const order = { orderType: "DELIVERY", status: "PLACED" };

    expect(requiresOrderTimeForStatusTransition(order, "CONFIRMED")).toBe(true);
    expect(canDirectlyUpdateOrderStatus(order)).toBe(false);
  });

  it("allows direct updates after confirmation when no extra input is needed", () => {
    expect(
      canDirectlyUpdateOrderStatus({
        orderType: "DELIVERY",
        status: "CONFIRMED",
      })
    ).toBe(true);
    expect(
      canDirectlyUpdateOrderStatus({
        orderType: "TAKEAWAY",
        status: "PREPARING",
      })
    ).toBe(true);
    expect(
      canDirectlyUpdateOrderStatus({
        orderType: "DINE_IN",
        status: "PREPARING",
      })
    ).toBe(true);
  });

  it("allows delivery orders to be sent out directly from confirmed", () => {
    expect(
      canSendDeliveryOrderOutDirectly({
        orderType: "DELIVERY",
        status: "CONFIRMED",
      })
    ).toBe(true);
    expect(
      canSendDeliveryOrderOutDirectly({
        orderType: "TAKEAWAY",
        status: "CONFIRMED",
      })
    ).toBe(false);
    expect(
      canSendDeliveryOrderOutDirectly({
        orderType: "DELIVERY",
        status: "PREPARING",
      })
    ).toBe(false);
  });

  it("allows external delivery fulfillment only for active delivery orders", () => {
    expect(canUseExternalDeliveryFulfillment({ orderType: "DELIVERY", status: "CONFIRMED" })).toBe(true);
    expect(canUseExternalDeliveryFulfillment({ orderType: "DELIVERY", status: "PREPARING" })).toBe(true);
    expect(canUseExternalDeliveryFulfillment({ orderType: "TAKEAWAY", status: "PREPARING" })).toBe(false);
    expect(canUseExternalDeliveryFulfillment({ orderType: "DINE_IN", status: "PREPARING" })).toBe(false);
    expect(canUseExternalDeliveryFulfillment({ orderType: "DELIVERY", status: "PLACED" })).toBe(false);
  });

  it("keeps delivery completion in the popup until an OTP is available", () => {
    expect(
      canDirectlyUpdateOrderStatus({
        orderType: "DELIVERY",
        status: "OUT_FOR_DELIVERY",
      })
    ).toBe(false);
    expect(
      canDirectlyUpdateOrderStatus({
        orderType: "DELIVERY",
        status: "OUT_FOR_DELIVERY",
        deliveryOtp: "1234",
      })
    ).toBe(true);
  });

  it("allows cancel and reject actions only before terminal statuses", () => {
    expect(canTerminateOrderStatus({ status: "PREPARING" })).toBe(true);
    expect(canTerminateOrderStatus({ status: "DELIVERED" })).toBe(false);
    expect(canTerminateOrderStatus({ status: "REJECTED" })).toBe(false);
  });

  it("builds covered progress steps for normal and terminal updates", () => {
    expect(
      getOrderStatusProgressSteps({
        orderType: "DELIVERY",
        status: "OUT_FOR_DELIVERY",
      })
    ).toEqual(["PLACED", "CONFIRMED", "PREPARING", "OUT_FOR_DELIVERY"]);
    expect(
      getOrderStatusProgressSteps({
        orderType: "TAKEAWAY",
        previousStatus: "PREPARING",
        status: "CANCELLED",
      })
    ).toEqual(["PLACED", "CONFIRMED", "PREPARING", "CANCELLED"]);
  });
});
