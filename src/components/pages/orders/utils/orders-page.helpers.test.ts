import { describe, expect, it } from "vitest";

import { buildOrderStats } from "./orders-page.helpers";

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
    expect(stats.find(({ _id }) => _id === "cod-amount")?.value).toContain(
      "€",
    );
    expect(
      stats.find(({ _id }) => _id === "digital-amount")?.value,
    ).toContain("75");
  });
});
