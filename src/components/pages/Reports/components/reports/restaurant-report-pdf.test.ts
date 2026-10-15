import { describe, expect, it } from "vitest";

import {
  buildOrderPaymentDetailsTable,
  buildOrderReportSummaryRows,
  formatReportDate,
} from "./restaurant-report-pdf";

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
      "Bestellnummer",
      "Bestelldatum und Uhrzeit",
      "Bezahlt mit",
      "Gesamt (EUR)",
    ]);
    expect(table.head).not.toContain("Status");
    expect(table.body[0]).toHaveLength(4);
    expect(table.body[0][1]).toMatch(/21\.09\.2026.*14:35/);
    expect(table.body[0][2]).toBe("PayPal");
  });

  it("uses the selected local calendar dates without UTC day rollover", () => {
    const from = new Date(2026, 9, 1, 0, 0, 0, 0).toISOString();
    const to = new Date(2026, 9, 14, 23, 59, 59, 999).toISOString();

    expect(formatReportDate(from)).toBe("01.10.2026");
    expect(formatReportDate(to)).toBe("14.10.2026");
  });

  it("combines count and amount per German payment category", () => {
    const rows = buildOrderReportSummaryRows(
      {
        totalOrders: 14,
        totalRevenue: 391.6,
        paymentMethodSummary: [
          { paymentMethod: "COD", count: 7, amount: 173 },
          { paymentMethod: "CARD_ON_DELIVERY", count: 1, amount: 34.5 },
          { paymentMethod: "PAYPAL", count: 5, amount: 158.1 },
          { paymentMethod: "STRIPE", count: 1, amount: 26 },
        ],
      },
      "EUR",
    );

    expect(rows.map(([label]) => label)).toEqual([
      "Barzahlung (7)",
      "Kartenzahlung (1)",
      "PayPal (5)",
      "Online-Zahlung (1)",
      "Gesamtbestellungen (14)",
    ]);
    expect(rows.at(-1)?.[1].replace(/\s/g, " ")).toBe("391,60 €");
  });
});
