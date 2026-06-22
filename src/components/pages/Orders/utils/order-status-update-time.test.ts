import { describe, expect, it } from "vitest";

import {
  resolveStatusUpdateOrderTime,
  shouldPreserveScheduledOrderTime,
} from "@/components/pages/Orders/utils/order-status-update-time";

describe("order status update time", () => {
  it("preserves the customer selected scheduled time when accepting a scheduled order", () => {
    const scheduledTime = "2026-06-20T08:00:00.000Z";
    const adminTime = new Date("2026-06-25T08:00:00.000Z");

    expect(
      resolveStatusUpdateOrderTime({
        canEditDeliveryTime: false,
        deliveryTime: adminTime,
        order: {
          status: "PLACED",
          isScheduled: true,
          orderTime: scheduledTime,
        },
        selectedStatus: "CONFIRMED",
      })
    ).toBe(scheduledTime);
  });

  it("uses the admin selected delivery time for ASAP order acceptance", () => {
    const adminTime = new Date("2026-06-25T08:00:00.000Z");

    expect(
      resolveStatusUpdateOrderTime({
        canEditDeliveryTime: true,
        deliveryTime: adminTime,
        order: {
          status: "PLACED",
          isScheduled: false,
          orderTime: undefined,
        },
        selectedStatus: "CONFIRMED",
      })
    ).toBe("2026-06-25T08:00:00.000Z");
  });

  it("does not preserve invalid scheduled timestamps", () => {
    expect(
      shouldPreserveScheduledOrderTime(
        {
          status: "PLACED",
          isScheduled: true,
          orderTime: "not-a-date",
        },
        "CONFIRMED"
      )
    ).toBe(false);
  });
});
