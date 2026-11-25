import { describe, expect, it } from "vitest";

import { getPaginationModel } from "./pagination-model";

describe("customer pagination model", () => {
  it("updates the visible range from filtered response metadata", () => {
    expect(
      getPaginationModel({ page: 2, limit: 10, total: 13, totalPages: 2 }),
    ).toMatchObject({ from: 11, to: 13, total: 13, pages: [1, 2] });
  });

  it("shows a zero range for empty filtered results", () => {
    expect(
      getPaginationModel({ page: 1, limit: 10, total: 0, totalPages: 1 }),
    ).toMatchObject({ from: 0, to: 0, total: 0, pages: [1] });
  });

  it("bounds large page lists around the active page", () => {
    expect(
      getPaginationModel({ page: 50, limit: 10, total: 1000, totalPages: 100 })
        .pages,
    ).toEqual([47, 48, 49, 50, 51, 52, 53]);
  });
});
