import { describe, expect, it } from "vitest";

import {
  buildTableReservationAssignmentPayload,
  buildTableReservationStatusPayload,
  getTableReservationQuickActions,
} from "@/components/pages/TableReservations/utils/table-reservation-actions";
import {
  getCustomerDisplayEmail,
  hasInternalGuestEmail,
  INTERNAL_GUEST_EMAIL_PATTERN,
  isWalkInReservation,
} from "@/components/pages/TableReservations/utils/table-reservations-formatters";
import type { TableReservationCustomer } from "@/types/table-reservations";

const ids = (status: string) =>
  getTableReservationQuickActions({ status }).map((action) => action.id);

describe("reservation quick actions", () => {
  it("offers confirm, no-show, and cancel for a requested reservation (never seat)", () => {
    expect(ids("REQUESTED")).toEqual(["confirm", "noShow", "cancel"]);
  });

  it("offers seat, no-show, and cancel once confirmed", () => {
    expect(ids("CONFIRMED")).toEqual(["seat", "noShow", "cancel"]);
  });

  it("only allows completing a seated guest (never cancel)", () => {
    expect(ids("SEATED")).toEqual(["complete"]);
  });

  it.each(["COMPLETED", "CANCELLED", "NO_SHOW", "UNKNOWN"])("offers nothing for %s", (status) => {
    expect(ids(status)).toEqual([]);
  });

  it("marks only irreversible actions as destructive and confirmable", () => {
    const actions = getTableReservationQuickActions({ status: "REQUESTED" });
    expect(actions.filter((action) => action.requiresConfirmation).map((action) => action.id)).toEqual([
      "noShow",
      "cancel",
    ]);
    expect(actions.filter((action) => action.destructive).map((action) => action.id)).toEqual([
      "noShow",
      "cancel",
    ]);
  });

  const customer: TableReservationCustomer = {
    id: "customer-1",
    email: "a@example.com",
    firstName: "A",
    lastName: "B",
    phone: null,
    avatarUrl: null,
  };

  it("builds the status payload from the reservation scope first", () => {
    expect(
      buildTableReservationStatusPayload({ branchId: "branch-9", customer }, "SEATED", {
        restaurantId: "restaurant-1",
        branchId: "branch-1",
      })
    ).toEqual({
      status: "SEATED",
      restaurantId: "restaurant-1",
      branchId: "branch-9",
      customerId: "customer-1",
    });

    expect(buildTableReservationStatusPayload({ branchId: null, customer: null }, "NO_SHOW")).toEqual({
      status: "NO_SHOW",
    });
  });

  it("builds the assignment payload with the same scope rules", () => {
    expect(
      buildTableReservationAssignmentPayload({ branchId: "branch-9", customer }, "T4", {
        restaurantId: "restaurant-1",
        branchId: "branch-1",
      })
    ).toEqual({
      tableLabel: "T4",
      restaurantId: "restaurant-1",
      branchId: "branch-9",
      customerId: "customer-1",
    });

    expect(buildTableReservationAssignmentPayload({ branchId: null, customer: null }, "T4")).toEqual({
      tableLabel: "T4",
    });
  });
});

describe("walk-in detection", () => {
  const internalGuest: TableReservationCustomer = {
    id: "guest-1",
    email: "pos-guest-rest-branch-1700000000-abc123@feastflow.local",
    firstName: "Walk-in",
    lastName: "Customer",
    phone: null,
    avatarUrl: null,
  };

  it("uses the persisted isWalkIn flag, not the customer email", () => {
    expect(isWalkInReservation({ isWalkIn: true })).toBe(true);
    expect(isWalkInReservation({ isWalkIn: false })).toBe(false);
  });

  it("hides legacy internal guest addresses without treating them as walk-ins", () => {
    expect(hasInternalGuestEmail(internalGuest)).toBe(true);
    expect(getCustomerDisplayEmail(internalGuest)).toBe("");
    expect(INTERNAL_GUEST_EMAIL_PATTERN.test("pos-guest-x@feastflow.local")).toBe(true);
  });

  it("keeps regular customers and their emails", () => {
    const regular = { ...internalGuest, email: "ada@example.com" };
    expect(hasInternalGuestEmail(regular)).toBe(false);
    expect(getCustomerDisplayEmail(regular)).toBe("ada@example.com");
    expect(hasInternalGuestEmail(null)).toBe(false);
  });
});
