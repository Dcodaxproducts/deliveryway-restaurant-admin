import { describe, expect, it } from "vitest";

import { TABLE_RESERVATIONS_DEFAULT_SORT } from "@/components/pages/TableReservations/utils/table-reservations-defaults";

describe("table reservation defaults", () => {
  it("uses Created At as the list date basis", () => {
    expect(TABLE_RESERVATIONS_DEFAULT_SORT).toEqual({
      sortBy: "createdAt",
      sortOrder: "DESC",
    });
  });
});
