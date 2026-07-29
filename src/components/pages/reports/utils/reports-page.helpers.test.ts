import { describe, expect, it } from "vitest";

import { mergeRestaurantBillingInvoices } from "./reports-page.helpers";
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
  it("keeps subscription and payout invoices while excluding orders", () => {
    const result = mergeRestaurantBillingInvoices(
      [
        makeInvoice("subscription", "SUBSCRIPTION", "2026-07-01T00:00:00Z"),
        makeInvoice("order", "ORDER", "2026-07-03T00:00:00Z"),
      ],
      [
        makeInvoice("payout", "WEEKLY_PAYOUT", "2026-07-02T00:00:00Z"),
      ],
    );

    expect(result.map(({ id }) => id)).toEqual(["payout", "subscription"]);
  });
});
