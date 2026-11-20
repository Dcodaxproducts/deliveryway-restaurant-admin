import { describe, expect, it } from "vitest";

import type { GeneratedInvoice } from "@/services/reports";
import {
  buildBillingInvoiceParams,
  buildGeneratedInvoiceActionParams,
  getGeneratedInvoiceStatusTone,
  getInvoiceDownloads,
  getInvoiceLinkedRecord,
  isRestaurantBillingInvoice,
} from "./generated-invoice-history.helpers";

const invoice = (
  overrides: Partial<GeneratedInvoice> = {},
): GeneratedInvoice => ({
  id: "invoice-1",
  invoiceNumber: "SUB-INV-1",
  kind: "SUBSCRIPTION",
  status: "ISSUED",
  totalAmount: 159,
  sentCount: 0,
  downloadedCount: 0,
  ...overrides,
});

describe("generated invoice history helpers", () => {
  it("builds a restaurant and branch scoped query with active filters", () => {
    expect(
      buildBillingInvoiceParams({
        restaurantId: "restaurant-1",
        branchId: "branch-1",
        filters: {
          kind: "WEEKLY_PAYOUT",
          status: "PAID",
          fromDate: "2026-11-01",
          toDate: "2026-11-20",
        },
      }),
    ).toEqual({
      restaurantId: "restaurant-1",
      branchId: "branch-1",
      kind: "WEEKLY_PAYOUT",
      status: "PAID",
      fromDate: "2026-11-01",
      toDate: "2026-11-20",
    });
  });

  it("omits inactive filters while preserving restaurant scope", () => {
    expect(
      buildBillingInvoiceParams({
        restaurantId: "restaurant-1",
        filters: { kind: "ALL", status: "ALL", fromDate: "", toDate: "" },
      }),
    ).toEqual({
      restaurantId: "restaurant-1",
      branchId: undefined,
      kind: undefined,
      status: undefined,
      fromDate: undefined,
      toDate: undefined,
    });
  });

  it("keeps view and download actions inside the invoice restaurant and branch scope", () => {
    expect(
      buildGeneratedInvoiceActionParams({
        invoice: invoice({
          restaurantId: "invoice-restaurant",
          branchId: "invoice-branch",
        }),
        restaurantId: "session-restaurant",
        branchId: "session-branch",
      }),
    ).toEqual({
      restaurantId: "invoice-restaurant",
      branchId: "invoice-branch",
      kind: "SUBSCRIPTION",
    });
  });

  it("keeps only current subscription and weekly payout kinds", () => {
    expect(isRestaurantBillingInvoice(invoice())).toBe(true);
    expect(isRestaurantBillingInvoice(invoice({ kind: "WEEKLY_PAYOUT" }))).toBe(
      true,
    );
    expect(isRestaurantBillingInvoice(invoice({ kind: "ORDER" }))).toBe(false);
  });

  it("normalizes activity, linked records, and status tones", () => {
    expect(
      getInvoiceDownloads(invoice({ downloadedCount: 0, downloadCount: "3" })),
    ).toBe(0);
    expect(
      getInvoiceDownloads(
        invoice({
          downloadedCount: undefined as unknown as number,
          downloadsCount: "4",
        }),
      ),
    ).toBe(4);
    expect(
      getInvoiceLinkedRecord(invoice({ subscriptionId: "subscription-1" })),
    ).toEqual({ type: "subscription", id: "subscription-1" });
    expect(getGeneratedInvoiceStatusTone("PAID")).toBe("success");
    expect(getGeneratedInvoiceStatusTone("FAILED")).toBe("danger");
    expect(getGeneratedInvoiceStatusTone("DRAFT")).toBe("neutral");
  });
});
