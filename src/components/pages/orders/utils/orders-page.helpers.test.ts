import { describe, expect, it } from "vitest";

import { buildOrderStats, canRequestOrdersReport } from "./orders-page.helpers";

describe("buildOrderStats", () => {
  it("renders confirmed full-order COD and digital totals in configured currency", () => {
    const t = (key: string) => key;
    const stats = buildOrderStats(
      {
        totalOrders: 5,
        totalRevenue: 125,
        averageOrderValue: 25,
        codAmount: 50,
        digitalAmount: 75,
        statusBreakdown: [],
        paymentStatusBreakdown: [],
      },
      t,
      "EUR",
    );

    expect(stats).toHaveLength(6);
    expect(stats.find(({ _id }) => _id === "cod-amount")?.value).toContain("€");
    expect(stats.find(({ _id }) => _id === "digital-amount")?.value).toContain(
      "75",
    );
  });

  it("reads cancelled orders from the report key/count contract", () => {
    const stats = buildOrderStats(
      {
        totalOrders: 5,
        statusBreakdown: [{ key: "CANCELLED", count: 2 }],
        paymentStatusBreakdown: [],
      },
      (key: string) => key,
      "EUR",
    );

    expect(stats.find(({ _id }) => _id === "cancelled-orders")?.value).toBe(2);
  });
});

describe("canRequestOrdersReport", () => {
  it("allows the API to resolve an employee's assigned scope", () => {
    expect(
      canRequestOrdersReport({
        isStaff: true,
        restaurantId: undefined,
      }),
    ).toBe(true);
  });

  it("waits for a restaurant scope for non-staff users", () => {
    expect(
      canRequestOrdersReport({
        isStaff: false,
        restaurantId: undefined,
      }),
    ).toBe(false);
  });
});
