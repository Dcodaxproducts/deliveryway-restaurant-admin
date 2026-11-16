import { describe, expect, it } from "vitest";
import {
  haveOverlappingBreaks,
  isBreakWithinOpeningWindow,
  isOvernightSchedule,
} from "./opening-hours-validation";

describe("cross-midnight opening hours", () => {
  it("recognizes overnight and 24-hour windows", () => {
    expect(isOvernightSchedule("18:00", "02:00")).toBe(true);
    expect(isOvernightSchedule("00:00", "00:00")).toBe(true);
    expect(isOvernightSchedule("09:00", "18:00")).toBe(false);
  });

  it("accepts breaks on either side of midnight inside an overnight window", () => {
    expect(isBreakWithinOpeningWindow({ startTime: "23:30", endTime: "00:15" }, "18:00", "02:00")).toBe(true);
    expect(isBreakWithinOpeningWindow({ startTime: "01:00", endTime: "01:30" }, "18:00", "02:00")).toBe(true);
  });

  it("rejects out-of-window, zero-length, and overlapping breaks", () => {
    expect(isBreakWithinOpeningWindow({ startTime: "17:30", endTime: "18:30" }, "18:00", "02:00")).toBe(false);
    expect(isBreakWithinOpeningWindow({ startTime: "23:00", endTime: "23:00" }, "18:00", "02:00")).toBe(false);
    expect(haveOverlappingBreaks([
      { startTime: "23:00", endTime: "00:30" },
      { startTime: "00:15", endTime: "01:00" },
    ], "18:00")).toBe(true);
  });
});
