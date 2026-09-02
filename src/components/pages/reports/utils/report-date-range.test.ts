import { describe, expect, it } from "vitest";

import {
  isValidCustomReportPeriod,
  resolveReportDateRange,
} from "./report-date-range";

describe("report date range", () => {
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
