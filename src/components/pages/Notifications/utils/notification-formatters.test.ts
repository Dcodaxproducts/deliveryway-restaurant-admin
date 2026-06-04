import { describe, expect, it } from "vitest";

import { formatAdminNotification } from "@/components/pages/Notifications/utils/notification-formatters";
import type { AdminNotification } from "@/types/notifications";

describe("notification formatter", () => {
  it("maps reservation requested notifications to readable copy", () => {
    const notification: AdminNotification = {
      id: "notification-1",
      type: "TABLE_RESERVATION_REQUESTED",
      description: "A customer requested a table.",
      metadata: {
        reservationId: "reservation-1",
        branchId: "branch-1",
        customerId: "customer-1",
      },
    };

    const formatted = formatAdminNotification(notification);

    expect(formatted).toMatchObject({
      title: "New reservation request",
      category: "reservation",
      href: "/table-reservations?search=reservation-1",
    });
  });

  it("maps reservation accepted or confirmed notifications to readable copy", () => {
    expect(
      formatAdminNotification({
        id: "notification-2",
        type: "RESERVATION_ACCEPTED",
        message: "Reservation auto accepted.",
      })
    ).toMatchObject({
      title: "Reservation confirmed",
      category: "reservation",
    });

    expect(
      formatAdminNotification({
        id: "notification-3",
        type: "TABLE_RESERVATION_CONFIRMED",
        message: "Reservation confirmed.",
      })
    ).toMatchObject({
      title: "Reservation confirmed",
      category: "reservation",
    });
  });

  it("falls back safely for unknown notifications", () => {
    const formatted = formatAdminNotification({
      id: "notification-4",
      type: "SOMETHING_ELSE",
      title: "Backend title",
      description: "Backend description",
    });

    expect(formatted).toMatchObject({
      title: "Backend title",
      description: "Backend description",
      category: "default",
    });
  });
});
