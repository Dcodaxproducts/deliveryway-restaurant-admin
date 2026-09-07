import { describe, expect, it } from "vitest";

import {
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
});
