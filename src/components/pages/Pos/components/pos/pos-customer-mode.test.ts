import { describe, expect, it } from "vitest";

import {
  emptyPosWalkInDraft,
  isValidPosGuestPhone,
  mergePosWalkInDraft,
  parsePosCustomerMode,
  parsePosWalkInDraft,
  serializePosCustomerMode,
  serializePosWalkInDraft,
} from "./pos-customer-mode";

describe("POS customer mode", () => {
  it("defaults to walk-in and persists the mode only for the active restaurant", () => {
    expect(parsePosCustomerMode(null, "restaurant-1")).toBe("walk-in");
    const raw = serializePosCustomerMode("restaurant-1", "existing");
    expect(parsePosCustomerMode(raw, "restaurant-1")).toBe("existing");
    expect(parsePosCustomerMode(raw, "restaurant-2")).toBe("walk-in");
  });

  it("does not leak guest draft values across restaurants", () => {
    const raw = serializePosWalkInDraft("restaurant-1", {
      name: "Bilal Shah",
      phone: "+49123456789",
      email: "bilal@example.com",
    });

    expect(parsePosWalkInDraft(raw, "restaurant-1")).toEqual({
      name: "Bilal Shah",
      phone: "+49123456789",
      email: "bilal@example.com",
    });
    expect(parsePosWalkInDraft(raw, "restaurant-2")).toEqual(
      emptyPosWalkInDraft(),
    );
  });

  it("merges supplied walk-in details without changing the guest identity", () => {
    expect(
      mergePosWalkInDraft(
        {
          id: "guest-1",
          firstName: "Walk-in",
          lastName: "Customer",
          isGuest: true,
        },
        {
          name: "Bilal Shah",
          phone: "+49123456789",
          email: "bilal@example.com",
        },
      ),
    ).toMatchObject({
      id: "guest-1",
      firstName: "Bilal",
      lastName: "Shah",
      phone: "+49123456789",
      email: "bilal@example.com",
      isGuest: true,
    });
  });

  it("uses the shared optional phone rule", () => {
    expect(isValidPosGuestPhone("")).toBe(true);
    expect(isValidPosGuestPhone("+49 151 23456789")).toBe(true);
    expect(isValidPosGuestPhone("123")).toBe(false);
    expect(isValidPosGuestPhone("call-me")).toBe(false);
  });
});
