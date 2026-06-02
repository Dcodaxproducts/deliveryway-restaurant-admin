import { describe, expect, it } from "vitest";

import {
  formatDateTime,
  formatShortId,
  formatStatusLabel,
  getCustomerFullName,
} from "@/components/pages/TableReservations/utils/table-reservations-formatters";
import type { TableReservationCustomer } from "@/types/table-reservations";

describe("table reservation formatters", () => {
  it("formats a full customer name", () => {
    const customer: TableReservationCustomer = {
      id: "customer-1",
      email: "customer@example.com",
      firstName: "Ada",
      lastName: "Lovelace",
      phone: null,
      avatarUrl: null,
    };

    expect(getCustomerFullName(customer)).toBe("Ada Lovelace");
  });

  it("falls back for a missing customer", () => {
    expect(getCustomerFullName(null)).toBe("Unknown customer");
  });

  it("formats long identifiers as short ids", () => {
    expect(formatShortId("reservation-123456789")).toBe("reserv...6789");
  });

  it("falls back for invalid dates", () => {
    expect(formatDateTime("not-a-date")).toBe("—");
  });

  it("formats status labels", () => {
    expect(formatStatusLabel("NO_SHOW")).toBe("No Show");
  });
});
