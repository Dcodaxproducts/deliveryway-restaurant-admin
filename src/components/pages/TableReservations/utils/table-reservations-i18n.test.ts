import { describe, expect, it } from "vitest";

import de from "@/messages/de.json";
import en from "@/messages/en.json";

const requiredReservationKeys = [
  "title",
  "description",
  "filtersTitle",
  "filtersDescription",
  "searchPlaceholder",
  "createdAt",
  "reservationDate",
  "customerName",
  "customerEmail",
  "customerPhone",
  "unknownCustomer",
  "noEmail",
  "noPhone",
  "ascending",
  "descending",
  "loading",
  "errorTitle",
  "emptyTitle",
  "emptyDescription",
  "updateStatusTitle",
  "updateStatusDescription",
] as const;

describe("table reservation translations", () => {
  it("keeps complete English and German parity for reservation UI copy", () => {
    for (const key of requiredReservationKeys) {
      expect(en.tableReservations[key]).toBeTruthy();
      expect(de.tableReservations[key]).toBeTruthy();
    }
  });

  it("uses German customer contact and Created At labels", () => {
    expect(de.tableReservations.createdAt).toBe("Erstellt am");
    expect(de.tableReservations.customerEmail).toBe("E-Mail");
    expect(de.tableReservations.customerPhone).toBe("Telefon");
    expect(de.tableReservations.noPhone).toBe("Keine Telefonnummer angegeben");
  });
});
