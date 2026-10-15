import { describe, expect, it } from "vitest";

import {
  buildReportTrendParams,
  getPreviousCalendarMonthPeriod,
  isValidCustomReportPeriod,
  resolveReportDateRange,
} from "./report-date-range";

describe("report date range", () => {
  it("returns the complete previous calendar month", () => {
    expect(
      getPreviousCalendarMonthPeriod(new Date(2026, 8, 7, 10, 30)),
    ).toEqual({ from: "2026-08-01", to: "2026-08-31" });
    expect(
      getPreviousCalendarMonthPeriod(new Date(2026, 0, 15, 10, 30)),
    ).toEqual({ from: "2025-12-01", to: "2025-12-31" });
  });

  it("uses the complete selected calendar days", () => {
    const result = resolveReportDateRange(
      "daily",
      { from: "2026-08-28", to: "2026-08-31" },
      new Date("2026-09-02T10:00:00.000Z"),
    );

    expect(new Date(result.fromDate).getHours()).toBe(0);
    expect(new Date(result.toDate).getHours()).toBe(23);
    expect(new Date(result.toDate).getMinutes()).toBe(59);
  });

  it("rejects an end date before the start date", () => {
    expect(
      isValidCustomReportPeriod({ from: "2026-09-02", to: "2026-09-01" }),
    ).toBe(false);
  });

  it.each(["daily", "weekly", "monthly"] as const)(
    "passes the same %s period to summary and trend requests",
    (range) => {
      const summaryPeriod = resolveReportDateRange(
        range,
        null,
        new Date(2026, 8, 24, 12, 0, 0),
      );

      expect(
        buildReportTrendParams(
          { restaurantId: "restaurant-1" },
          summaryPeriod,
          range,
        ),
      ).toMatchObject({
        ...summaryPeriod,
        restaurantId: "restaurant-1",
        range,
      });
    },
  );

  it("keeps custom dates and delegated staff branch scope on trend requests", () => {
    const summaryPeriod = resolveReportDateRange(
      "daily",
      { from: "2026-09-01", to: "2026-09-14" },
      new Date(2026, 8, 24, 12, 0, 0),
    );

    expect(
      buildReportTrendParams(
        { restaurantId: "restaurant-1", branchId: "branch-7" },
        summaryPeriod,
        "monthly",
      ),
    ).toEqual({
      restaurantId: "restaurant-1",
      branchId: "branch-7",
      ...summaryPeriod,
      range: "monthly",
    });
  });

  it("keeps mixed standard and group orders in both summary and trend requests", () => {
    const summaryParams = {
      restaurantId: "restaurant-1",
      branchId: "branch-7",
      ...resolveReportDateRange(
        "weekly",
        { from: "2026-09-01", to: "2026-09-14" },
      ),
    };

    const trendParams = buildReportTrendParams(
      summaryParams,
      summaryParams,
      "weekly",
    );

    expect(summaryParams).not.toHaveProperty("kind");
    expect(trendParams).not.toHaveProperty("kind");
    expect(trendParams).toMatchObject(summaryParams);
  });
});
