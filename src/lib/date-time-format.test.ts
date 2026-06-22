import { describe, expect, it } from "vitest";

import { formatDateTime24, formatTime24 } from "@/lib/date-time-format";

describe("date time formatters", () => {
  it("formats date-time values without AM/PM", () => {
    expect(
      formatDateTime24({
        value: "2026-06-20T08:05:00.000Z",
        options: {
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        },
      })
    ).toMatch(/08:05$/);
  });

  it("formats time-only values with a 24-hour clock", () => {
    expect(formatTime24({ value: "14:30" })).toBe("14:30");
    expect(formatTime24({ value: "00:05" })).toBe("00:05");
  });
});
