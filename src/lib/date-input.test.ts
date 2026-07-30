import { describe, expect, it, vi } from "vitest";

import { getLocalTodayDateTimeInputValue } from "./date-input";

describe("date input minimums", () => {
  it("starts datetime selection at local midnight today", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 6, 30, 15, 45));

    expect(getLocalTodayDateTimeInputValue()).toBe("2026-07-30T00:00");

    vi.useRealTimers();
  });
});
