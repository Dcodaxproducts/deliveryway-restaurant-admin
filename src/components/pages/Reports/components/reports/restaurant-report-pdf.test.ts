import { describe, expect, it } from "vitest";

import {
  buildFinancialDetailRows,
  buildFinancialSummaryStats,
  buildOrderPaymentDetailsTable,
  buildOrderReportSummaryRows,
  formatPaymentMethod,
  formatReportDate,
  ORDER_REPORT_LABELS,
} from "./restaurant-report-pdf";

describe("restaurant financial report PDF", () => {
  it("keeps only the combined localized orders and gross revenue detail row", () => {
    expect(
      buildFinancialDetailRows(
        {
          totalOrders: 9,
          grossRevenue: 392.5,
          paidRevenue: 330.4,
          netRevenue: 330.4,
          averageOrderValue: 43.61,
          totalTax: 26.84,
          totalDeliveryFee: 8,
          refundedAmount: 0,
        },
        "EUR",
      ).map(([label, value]) => [label, value.replace(/\s/g, " ")]),
    ).toEqual([["Gesamtbestellungen (9)", "392,50 €"]]);
  });

  it("renames cash and removes refunded amount only from the PDF summary", () => {
    const source = [
      {
        id: "financial-cod-amount",
        title: "Nachnahme gesamt",
        value: "79,90 €",
      },
      {
        id: "financial-online-amount",
        title: "Online-Zahlungen gesamt",
        value: "312,60 €",
      },
      {
        id: "financial-refunded",
        title: "Erstatteter Betrag",
        value: "0,00 €",
      },
    ];

    expect(buildFinancialSummaryStats(source)).toEqual([
      {
        id: "financial-cod-amount",
        title: "Barzahlung gesamt",
        value: "79,90 €",
      },
      source[1],
    ]);
    expect(source[0]?.title).toBe("Nachnahme gesamt");
  });
});

describe("restaurant order report PDF", () => {
  it("uses German order-history and section headings", () => {
    expect(ORDER_REPORT_LABELS).toEqual({
      history: "Bestellhistorie",
      overview: "Bestellübersicht",
      orderDateTime: "Bestelldatum und Uhrzeit",
      paidWith: "Bezahlt mit",
      summary: "Zusammenfassung",
      payoutOverview: "Auszahlungsübersicht",
    });
  });

  it.each([
    ["COD", "Barzahlung"],
    ["CARD_ON_DELIVERY", "Kartenzahlung"],
    ["PAYPAL", "PayPal"],
    ["STRIPE", "Online-Zahlung"],
    ["EASYPAISA", "Online-Zahlung"],
    ["JAZZCASH", "Online-Zahlung"],
    ["BANK_TRANSFER", "Online-Zahlung"],
    ["WALLET", "Online-Zahlung"],
  ])("labels %s as %s", (paymentMethod, label) => {
    expect(formatPaymentMethod(paymentMethod)).toBe(label);
  });

  it("renders the German history columns and leaves status exclusion to the API", () => {
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
    expect(table.body[0][1]).toMatch(/21\.09\.2026/);
    expect(table.body[0][2]).toBe("PayPal");
  });

  it("uses the selected local calendar dates without UTC day rollover", () => {
    const from = new Date(2026, 9, 1, 0, 0, 0, 0).toISOString();
    const to = new Date(2026, 9, 14, 23, 59, 59, 999).toISOString();

    expect(formatReportDate(from)).toBe("01.10.2026");
    expect(formatReportDate(to)).toBe("14.10.2026");
    expect(formatReportDate("2026-10-01")).toBe("01.10.2026");
    expect(formatReportDate("2026-10-14")).toBe("14.10.2026");
  });

  it("groups PayPal into online payments and keeps card-on-delivery separate", () => {
    const rows = buildOrderReportSummaryRows(
      {
        totalOrders: 14,
        totalRevenue: 391.6,
        paymentMethodSummary: [
          { paymentMethod: "COD", count: 8, amount: 207.5 },
          { paymentMethod: "CARD_ON_DELIVERY", count: 0, amount: 0 },
          { paymentMethod: "PAYPAL", count: 6, amount: 184.1 },
        ],
      },
      "EUR",
    );

    expect(rows.map(([label]) => label)).toEqual([
      "Barzahlung (8)",
      "Kartenzahlung (0)",
      "Online-Zahlung (6)",
      "Gesamtbestellungen (14)",
    ]);
    expect(rows.map(([, amount]) => amount.replace(/\s/g, " "))).toEqual([
      "207,50 €",
      "0,00 €",
      "184,10 €",
      "391,60 €",
    ]);
  });

  it("derives the same grouped summary from bounded API order rows when aggregates are absent", () => {
    const rows = buildOrderReportSummaryRows(
      {
        totalOrders: 3,
        totalRevenue: 60,
        orders: [
          {
            id: "cash",
            createdAt: "2026-10-01T10:00:00.000Z",
            paymentMethod: "COD",
            paymentStatus: "PENDING",
            totalAmount: 10,
          },
          {
            id: "card",
            createdAt: "2026-10-01T11:00:00.000Z",
            paymentMethod: "CARD_ON_DELIVERY",
            paymentStatus: "PENDING",
            totalAmount: 20,
          },
          {
            id: "online",
            createdAt: "2026-10-01T12:00:00.000Z",
            paymentMethod: "PAYPAL",
            paymentStatus: "PAID",
            totalAmount: 30,
          },
        ],
      },
      "EUR",
    );

    expect(rows.map(([label]) => label)).toEqual([
      "Barzahlung (1)",
      "Kartenzahlung (1)",
      "Online-Zahlung (1)",
      "Gesamtbestellungen (3)",
    ]);
  });
});
