import { describe, expect, it } from "vitest";

import { buildOrderPaymentDetailsTable } from "./restaurant-report-pdf";

describe("buildOrderPaymentDetailsTable", () => {
  it("omits payment status and includes the order date and time", () => {
    const table = buildOrderPaymentDetailsTable(
      [
        {
          id: "order-1",
          createdAt: "2026-09-21T14:35:00.000Z",
          paymentMethod: "paypal",
          paymentStatus: "PAID",
          totalAmount: 50.5,
        },
      ],
      "EUR",
    );

    expect(table.head).toEqual([
      "Order ID",
      "Order Date & Time",
      "Paid By",
      "Total (EUR)",
    ]);
    expect(table.head).not.toContain("Status");
    expect(table.body[0]).toHaveLength(4);
    expect(table.body[0][1]).toMatch(/21\.09\.2026.*14:35/);
  });
});
