import { describe, expect, it } from "vitest";

import {
  buildTableReservationStatusPayload,
  getTableReservationQuickActions,
} from "@/components/pages/TableReservations/utils/table-reservation-actions";
import {
  getCustomerDisplayEmail,
  isWalkInReservation,
  WALK_IN_GUEST_EMAIL_PATTERN,
  WALK_IN_SEARCH_TOKEN,
} from "@/components/pages/TableReservations/utils/table-reservations-formatters";
import type { TableReservationCustomer } from "@/types/table-reservations";

const ids = (status: string) =>
  getTableReservationQuickActions({ status }).map((action) => action.id);

describe("reservation quick actions", () => {
  it("offers seat, confirm, no-show, and cancel for a queued walk-in", () => {
    expect(ids("REQUESTED")).toEqual(["confirm", "seat", "noShow", "cancel"]);
  });

  it("offers seat, no-show, and cancel once confirmed", () => {
    expect(ids("CONFIRMED")).toEqual(["seat", "noShow", "cancel"]);
  });

  it("only allows completing or cancelling a seated guest", () => {
    expect(ids("SEATED")).toEqual(["complete", "cancel"]);
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

  it("builds the status payload from the reservation scope first", () => {
    const customer: TableReservationCustomer = {
      id: "customer-1",
      email: "a@example.com",
      firstName: "A",
      lastName: "B",
      phone: null,
      avatarUrl: null,
    };

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
});

describe("walk-in detection", () => {
  const walkIn: TableReservationCustomer = {
    id: "guest-1",
    email: "pos-guest-rest-branch-1700000000-abc123@feastflow.local",
    firstName: "Walk-in",
    lastName: "Customer",
    phone: null,
    avatarUrl: null,
  };

  it("recognizes API-generated walk-in guest emails and hides them", () => {
    expect(isWalkInReservation({ customer: walkIn })).toBe(true);
    expect(getCustomerDisplayEmail(walkIn)).toBe("");
    expect(WALK_IN_GUEST_EMAIL_PATTERN.test(`${WALK_IN_SEARCH_TOKEN}x@feastflow.local`)).toBe(true);
  });

  it("keeps regular customers and their emails", () => {
    const regular = { ...walkIn, email: "ada@example.com" };
    expect(isWalkInReservation({ customer: regular })).toBe(false);
    expect(getCustomerDisplayEmail(regular)).toBe("ada@example.com");
    expect(isWalkInReservation({ customer: null })).toBe(false);
  });
});
