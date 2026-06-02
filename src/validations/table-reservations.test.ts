import { describe, expect, it } from "vitest";

import { tableReservationStatusUpdateSchema } from "@/validations/table-reservations";

describe("table reservation status validation", () => {
  it("accepts supported statuses", () => {
    expect(tableReservationStatusUpdateSchema.safeParse({ status: "REQUESTED" }).success).toBe(true);
    expect(tableReservationStatusUpdateSchema.safeParse({ status: "CONFIRMED" }).success).toBe(true);
    expect(tableReservationStatusUpdateSchema.safeParse({ status: "SEATED" }).success).toBe(true);
    expect(tableReservationStatusUpdateSchema.safeParse({ status: "COMPLETED" }).success).toBe(true);
    expect(tableReservationStatusUpdateSchema.safeParse({ status: "CANCELLED" }).success).toBe(true);
  });

  it("rejects unsupported status", () => {
    expect(tableReservationStatusUpdateSchema.safeParse({ status: "NO_SHOW" }).success).toBe(false);
  });
});
