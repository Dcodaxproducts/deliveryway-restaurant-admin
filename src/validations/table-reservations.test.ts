import { describe, expect, it } from "vitest";

import {
  buildWalkInReservationDate,
  TABLE_RESERVATION_ERROR_CODES,
  tableLabelSchema,
  tableReservationStatusUpdateSchema,
  walkInReservationSchema,
} from "@/validations/table-reservations";

describe("table reservation status validation", () => {
  it.each(["REQUESTED", "CONFIRMED", "SEATED", "COMPLETED", "CANCELLED", "NO_SHOW"])(
    "accepts supported status %s",
    (status) => {
      expect(tableReservationStatusUpdateSchema.safeParse({ status }).success).toBe(true);
    }
  );

  it.each(["", "PENDING", "no_show", undefined])("rejects unsupported status %s", (status) => {
    const result = tableReservationStatusUpdateSchema.safeParse({ status });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(TABLE_RESERVATION_ERROR_CODES.statusRequired);
    }
  });
});

describe("walk-in reservation validation", () => {
  const valid = {
    branchId: "branch-1",
    guestName: "  Ada  ",
    guestPhone: "",
    guestCount: 4,
    waitMinutes: 15,
    note: "",
  };

  it("accepts the POS walk-in contract and trims text", () => {
    const result = walkInReservationSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.guestName).toBe("Ada");
      expect(result.data.guestCount).toBe(4);
    }
  });

  it.each([0, 51, 2.5, Number.NaN])("rejects guest count %s with a translatable code", (guestCount) => {
    const result = walkInReservationSchema.safeParse({ ...valid, guestCount });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.message)).toContain(
        TABLE_RESERVATION_ERROR_CODES.guestCountRange
      );
    }
  });

  it.each([0, 241, Number.NaN])("rejects wait minutes %s", (waitMinutes) => {
    const result = walkInReservationSchema.safeParse({ ...valid, waitMinutes });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.message)).toContain(
        TABLE_RESERVATION_ERROR_CODES.waitMinutesRange
      );
    }
  });

  it("requires a branch", () => {
    const result = walkInReservationSchema.safeParse({ ...valid, branchId: "  " });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(TABLE_RESERVATION_ERROR_CODES.branchRequired);
    }
  });

  it("builds a future ISO reservation date from the expected wait", () => {
    const now = new Date("2026-09-30T12:00:00.000Z");
    expect(buildWalkInReservationDate(15, now)).toBe("2026-09-30T12:15:00.000Z");
    expect(buildWalkInReservationDate(0, now)).toBe("2026-09-30T12:01:00.000Z");
  });
});

describe("table label validation", () => {
  it("accepts an empty label so an assignment can be cleared", () => {
    expect(tableLabelSchema.safeParse({ tableLabel: "" }).success).toBe(true);
  });

  it("caps the label length", () => {
    const result = tableLabelSchema.safeParse({ tableLabel: "x".repeat(25) });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(TABLE_RESERVATION_ERROR_CODES.tableLabelTooLong);
    }
  });
});
