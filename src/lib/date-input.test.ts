import { describe, expect, it, vi } from "vitest";

import {
  DATE_TIME_24_HOUR_INPUT_LANG,
  getLocalTodayDateTimeInputValue,
} from "./date-input";

describe("date input minimums", () => {
  it("uses a 24-hour locale for scheduled datetime controls", () => {
    expect(DATE_TIME_24_HOUR_INPUT_LANG).toBe("en-GB");
  });

  it("starts datetime selection at local midnight today", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 6, 30, 15, 45));

    expect(getLocalTodayDateTimeInputValue()).toBe("2026-07-30T00:00");

    vi.useRealTimers();
  });
});
