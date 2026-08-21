import { describe, expect, it } from "vitest";

import {
  buildOrdersScheduleQuery,
  isFutureOrder,
  matchesOrdersScheduleFilter,
} from "@/components/pages/Orders/utils/orders-schedule-filters";

const now = new Date("2026-06-18T09:00:00.000Z");

describe("orders schedule filters", () => {
  it("treats backend scheduled orders as preorders", () => {
    expect(isFutureOrder({ isScheduled: true }, now)).toBe(true);
  });

  it("treats future orderTime as preorder when isScheduled is missing", () => {
    expect(
      isFutureOrder({ orderTime: "2026-06-18T10:00:00.000Z" }, now)
    ).toBe(true);
  });

  it("keeps an explicit ASAP order out of preorders when its ready time is in the future", () => {
    const asapOrder = {
      isScheduled: false,
      orderTime: "2026-06-18T10:00:00.000Z",
    };

    expect(isFutureOrder(asapOrder, now)).toBe(false);
    expect(
      matchesOrdersScheduleFilter(asapOrder, "PREORDERS", {}, now)
    ).toBe(false);
    expect(
      matchesOrdersScheduleFilter(asapOrder, "TODAY_SCHEDULED", {}, now)
    ).toBe(false);
  });

  it("filters today's scheduled orders by order time", () => {
    expect(
      matchesOrdersScheduleFilter(
        { isScheduled: true, orderTime: "2026-06-18T12:00:00.000Z" },
        "TODAY_SCHEDULED",
        {},
        now
      )
    ).toBe(true);
    expect(
      matchesOrdersScheduleFilter(
        { isScheduled: true, orderTime: "2026-06-19T12:00:00.000Z" },
        "TODAY_SCHEDULED",
        {},
        now
      )
    ).toBe(false);
  });

  it("filters past scheduled orders", () => {
    expect(
      matchesOrdersScheduleFilter(
        { isScheduled: true, orderTime: "2026-06-18T08:00:00.000Z" },
        "PAST_SCHEDULED",
        {},
        now
      )
    ).toBe(true);
  });

  it("filters custom order time ranges inclusively by day", () => {
    expect(
      matchesOrdersScheduleFilter(
        { orderTime: "2026-06-20T23:30:00.000Z" },
        "CUSTOM_RANGE",
        {
          from: new Date("2026-06-19T00:00:00.000Z"),
          to: new Date("2026-06-20T00:00:00.000Z"),
        },
        now
      )
    ).toBe(true);
  });

  it("builds server-side schedule ranges before pagination", () => {
    expect(buildOrdersScheduleQuery("PREORDERS", {}, now)).toEqual({
      isScheduled: true,
    });
    expect(buildOrdersScheduleQuery("TODAY_SCHEDULED", {}, now)).toEqual({
      isScheduled: true,
      orderTimeFrom: "2026-06-18T00:00:00.000Z",
      orderTimeTo: "2026-06-18T23:59:59.999Z",
    });
    expect(buildOrdersScheduleQuery("PAST_SCHEDULED", {}, now)).toEqual({
      isScheduled: true,
      orderTimeTo: now.toISOString(),
    });
  });
});
