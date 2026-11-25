import { describe, expect, it } from "vitest";

import type { GeneratedInvoice } from "@/services/reports";
import {
  BILLING_INVOICE_PAGE_LIMIT,
  buildBillingInvoiceParams,
  buildBillingInvoiceRequests,
  buildGeneratedInvoiceActionParams,
  getGeneratedInvoiceStatusTone,
  getInvoiceDownloads,
  getInvoiceLinkedRecord,
  getInvoiceSnapshotName,
  hasBillingInvoiceQueryError,
  mergeBillingInvoices,
  isRestaurantBillingInvoice,
} from "./generated-invoice-history.helpers";

it("treats either failed billing request as an error instead of an empty history", () => {
  expect(
    hasBillingInvoiceQueryError([{ isError: false }, { isError: true }]),
  ).toBe(true);
  expect(
    hasBillingInvoiceQueryError([{ isError: false }, { isError: false }]),
  ).toBe(false);
});

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
      limit: BILLING_INVOICE_PAGE_LIMIT,
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
      limit: BILLING_INVOICE_PAGE_LIMIT,
    });
  });

  it("uses bounded parallel kind requests and merges them deterministically", () => {
    const requests = buildBillingInvoiceRequests({
      restaurantId: "restaurant-1",
      branchId: "branch-1",
      filters: {
        kind: "ALL",
        status: "ALL",
        fromDate: "",
        toDate: "2026-11-20",
      },
    });
    expect(requests.map((request) => request.kind)).toEqual([
      "SUBSCRIPTION",
      "WEEKLY_PAYOUT",
    ]);
    expect(
      requests.every((request) => request.limit === BILLING_INVOICE_PAGE_LIMIT),
    ).toBe(true);
    const duplicate = invoice({
      id: "duplicate",
      createdAt: "2026-11-19T10:00:00Z",
    });
    expect(
      mergeBillingInvoices([
        [
          invoice({ id: "older", createdAt: "2026-11-18T10:00:00Z" }),
          duplicate,
        ],
        [
          invoice({
            id: "newer",
            kind: "WEEKLY_PAYOUT",
            createdAt: "2026-11-20T10:00:00Z",
          }),
          duplicate,
        ],
      ]).map((item) => item.id),
    ).toEqual(["newer", "duplicate", "older"]);
  });

  it("falls back to the scoped branch ID when names are absent", () => {
    expect(
      getInvoiceSnapshotName(invoice({ branchId: "branch-1" }), "branch"),
    ).toBe("branch-1");
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
