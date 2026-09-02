import { describe, expect, it } from "vitest";

import {
  buildFinancialStats,
  getReportHeaderContent,
  mergeRestaurantBillingInvoices,
} from "./reports-page.helpers";
import type { GeneratedInvoice } from "@/services/reports";

const makeInvoice = (
  id: string,
  kind: GeneratedInvoice["kind"],
  createdAt: string,
): GeneratedInvoice => ({
  id,
  invoiceNumber: `INV-${id}`,
  kind,
  status: "ISSUED",
  totalAmount: 100,
  sentCount: 0,
  downloadedCount: 0,
  createdAt,
});

describe("mergeRestaurantBillingInvoices", () => {
  it("keeps unified subscription invoices while excluding legacy payout and order invoices", () => {
    const result = mergeRestaurantBillingInvoices(
      [
        makeInvoice("subscription", "SUBSCRIPTION", "2026-07-01T00:00:00Z"),
        makeInvoice("order", "ORDER", "2026-07-03T00:00:00Z"),
      ],
      [makeInvoice("payout", "WEEKLY_PAYOUT", "2026-07-02T00:00:00Z")],
    );

    expect(result.map(({ id }) => id)).toEqual(["subscription"]);
  });

  it("uses localized labels for report cards and headers", () => {
    const t = (key: string) => `translated:${key}`;

    expect(buildFinancialStats({}, "EUR", t)[0]?.title).toBe(
      "translated:stats.codAmount",
    );
    expect(getReportHeaderContent("invoice-history", false, t)).toEqual({
      title: "translated:headers.billingTitle",
      description: "translated:headers.billingDescription",
    });
  });

  it("shows net Stripe and PayPal receipts separately", () => {
    const stats = buildFinancialStats(
      {
        paymentMethodRevenue: [
          { paymentMethod: "STRIPE", received: 120, netReceived: 100 },
          { paymentMethod: "PAYPAL", received: 80, netReceived: 75 },
        ],
      },
      "EUR",
      (key) => key,
    );

    expect(
      stats.find((item) => item._id === "financial-stripe-received")?.value,
    ).toContain("100");
    expect(
      stats.find((item) => item._id === "financial-paypal-received")?.value,
    ).toContain("75");
    expect(stats).toHaveLength(6);
  });
});
