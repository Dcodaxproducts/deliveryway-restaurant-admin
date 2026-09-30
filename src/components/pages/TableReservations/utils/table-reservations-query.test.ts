import { describe, expect, it } from "vitest";

import {
  buildTableReservationDetailHref,
  buildTableReservationsListHref,
  buildTableReservationsQueryString,
  defaultTableReservationsListState,
  parseTableReservationsLimit,
  parseTableReservationsListState,
  parseTableReservationsPage,
  preserveTableReservationsListQuery,
} from "@/components/pages/TableReservations/utils/table-reservations-query";

describe("table reservations list query state", () => {
  it("returns defaults for an empty or missing query", () => {
    expect(parseTableReservationsListState(null)).toEqual(defaultTableReservationsListState);
    expect(parseTableReservationsListState(new URLSearchParams())).toEqual(
      defaultTableReservationsListState
    );
    expect(buildTableReservationsQueryString(defaultTableReservationsListState)).toBe("");
  });

  it("round-trips page, limit, and every filter", () => {
    const state = {
      filters: {
        search: "ada",
        status: "CONFIRMED",
        sortBy: "guestCount",
        sortOrder: "ASC" as const,
        branchId: "branch-2",
      },
      page: 3,
      limit: 50,
    };

    const query = buildTableReservationsQueryString(state);
    expect(query).toBe(
      "?search=ada&status=CONFIRMED&sortBy=guestCount&sortOrder=ASC&branchId=branch-2&page=3&limit=50"
    );
    expect(parseTableReservationsListState(new URLSearchParams(query))).toEqual(state);
    expect(buildTableReservationsListHref(state)).toBe(`/table-reservations${query}`);
  });

  it("falls back to supported values for invalid page, limit, status, and sort", () => {
    const state = parseTableReservationsListState(
      new URLSearchParams("page=0&limit=500&status=NO_SHOW&sortBy=status&sortOrder=random")
    );

    expect(state.page).toBe(1);
    expect(state.limit).toBe(50);
    expect(state.filters.status).toBe("ALL");
    expect(state.filters.sortBy).toBe("reservationDate");
    expect(state.filters.sortOrder).toBe("DESC");
  });

  it.each([
    ["abc", 1],
    ["-2", 1],
    ["2.5", 2],
    ["7", 7],
    [4, 4],
  ])("parses page %s as %s", (input, expected) => {
    expect(parseTableReservationsPage(input)).toBe(expected);
  });

  it.each([
    ["", 20],
    ["10", 10],
    ["25", 25],
    ["75", 50],
    ["0", 20],
    [50, 50],
  ])("caps limit %s at the API maximum (%s)", (input, expected) => {
    expect(parseTableReservationsLimit(input)).toBe(expected);
  });

  it("preserves only list-owned keys when returning from a detail page", () => {
    const query = preserveTableReservationsListQuery(
      new URLSearchParams("page=2&status=seated&acceptOrder=1&foo=bar")
    );
    expect(query).toBe("?status=SEATED&page=2");
  });

  it("builds detail links that carry the list query and encode the id", () => {
    expect(buildTableReservationDetailHref("res 1/2", "?page=2")).toBe(
      "/table-reservations/res%201%2F2?page=2"
    );
    expect(buildTableReservationDetailHref("res-1")).toBe("/table-reservations/res-1");
  });
});
