import { describe, expect, it } from "vitest";

import {
  TABLE_RESERVATION_ERROR_CODES,
  tableLabelSchema,
  tableReservationStatusUpdateSchema,
  walkInReservationSchema,
} from "@/validations/table-reservations";

const issueCodes = (result: { success: boolean; error?: { issues: { message: string }[] } }) =>
  result.success ? [] : (result.error?.issues ?? []).map((issue) => issue.message);

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
    customerId: "customer-1",
    branchId: "branch-1",
    guestCount: 4,
    tableLabel: "  T4 ",
    note: "",
  };

  it("accepts the admin walk-in contract and trims text", () => {
    const result = walkInReservationSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({
        customerId: "customer-1",
        branchId: "branch-1",
        guestCount: 4,
        tableLabel: "T4",
        note: "",
      });
    }
  });

  it("only knows the DTO fields", () => {
    expect(Object.keys(walkInReservationSchema.shape).sort()).toEqual(
      ["branchId", "customerId", "guestCount", "note", "tableLabel"].sort()
    );
  });

  it.each([0, 51, 2.5, Number.NaN])("rejects guest count %s with a translatable code", (guestCount) => {
    expect(issueCodes(walkInReservationSchema.safeParse({ ...valid, guestCount }))).toContain(
      TABLE_RESERVATION_ERROR_CODES.guestCountRange
    );
  });

  it("requires a customer and a branch", () => {
    expect(issueCodes(walkInReservationSchema.safeParse({ ...valid, customerId: "  " }))).toEqual([
      TABLE_RESERVATION_ERROR_CODES.customerRequired,
    ]);
    expect(issueCodes(walkInReservationSchema.safeParse({ ...valid, branchId: "  " }))).toEqual([
      TABLE_RESERVATION_ERROR_CODES.branchRequired,
    ]);
  });

  it("allows an empty table label at creation but caps its length", () => {
    expect(walkInReservationSchema.safeParse({ ...valid, tableLabel: "" }).success).toBe(true);
    expect(issueCodes(walkInReservationSchema.safeParse({ ...valid, tableLabel: "x".repeat(25) }))).toContain(
      TABLE_RESERVATION_ERROR_CODES.tableLabelTooLong
    );
  });

  it("caps the note length", () => {
    expect(issueCodes(walkInReservationSchema.safeParse({ ...valid, note: "x".repeat(501) }))).toContain(
      TABLE_RESERVATION_ERROR_CODES.noteTooLong
    );
  });
});

describe("table label validation", () => {
  it("requires a non-blank label because the assignment endpoint rejects empty labels", () => {
    for (const tableLabel of ["", "   "]) {
      expect(issueCodes(tableLabelSchema.safeParse({ tableLabel }))).toEqual([
        TABLE_RESERVATION_ERROR_CODES.tableLabelRequired,
      ]);
    }
  });

  it("trims and accepts a label", () => {
    const result = tableLabelSchema.safeParse({ tableLabel: " T4 " });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.tableLabel).toBe("T4");
  });

  it("caps the label length", () => {
    expect(issueCodes(tableLabelSchema.safeParse({ tableLabel: "x".repeat(25) }))).toEqual([
      TABLE_RESERVATION_ERROR_CODES.tableLabelTooLong,
    ]);
  });
});
