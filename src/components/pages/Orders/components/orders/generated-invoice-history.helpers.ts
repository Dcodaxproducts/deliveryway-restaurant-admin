import type {
  GeneratedInvoice,
  GeneratedInvoicesParams,
} from "@/services/reports";

export const BILLING_INVOICE_KINDS = ["SUBSCRIPTION", "WEEKLY_PAYOUT"] as const;
export type BillingInvoiceKind = (typeof BILLING_INVOICE_KINDS)[number];
export type BillingInvoiceFilters = {
  kind: "ALL" | BillingInvoiceKind;
  status: string;
  fromDate: string;
  toDate: string;
};

export const buildBillingInvoiceParams = ({
  filters,
  restaurantId,
  branchId,
}: {
  filters: BillingInvoiceFilters;
  restaurantId?: string | null;
  branchId?: string | null;
}): GeneratedInvoicesParams => ({
  restaurantId: restaurantId || undefined,
  branchId: branchId || undefined,
  kind: filters.kind === "ALL" ? undefined : filters.kind,
  status: filters.status === "ALL" ? undefined : filters.status,
  fromDate: filters.fromDate || undefined,
  toDate: filters.toDate || undefined,
});

export const isRestaurantBillingInvoice = (invoice: GeneratedInvoice) =>
  BILLING_INVOICE_KINDS.includes(invoice.kind as BillingInvoiceKind);

export const numericInvoiceValue = (value?: string | number | null) => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const getInvoiceDownloads = (invoice: GeneratedInvoice) =>
  numericInvoiceValue(
    invoice.downloadedCount ?? invoice.downloadCount ?? invoice.downloadsCount,
  );

export const getInvoiceSnapshotName = (
  invoice: GeneratedInvoice,
  key: "tenant" | "restaurant" | "branch",
) => invoice[`${key}Snapshot`]?.name || invoice[key]?.name || "-";

export const getInvoiceLinkedRecord = (invoice: GeneratedInvoice) => {
  if (invoice.orderId) return { type: "order" as const, id: invoice.orderId };
  if (invoice.subscriptionId) {
    return { type: "subscription" as const, id: invoice.subscriptionId };
  }
  return null;
};

export const getGeneratedInvoiceStatusTone = (status?: string | null) => {
  const normalized = status?.toUpperCase();
  if (["PAID", "SENT", "ISSUED"].includes(normalized || "")) return "success";
  if (["FAILED", "CANCELLED", "VOID"].includes(normalized || ""))
    return "danger";
  if (normalized === "DRAFT") return "neutral";
  return "warning";
};

export const buildGeneratedInvoiceActionParams = ({
  invoice,
  restaurantId,
  branchId,
}: {
  invoice: GeneratedInvoice;
  restaurantId?: string | null;
  branchId?: string | null;
}) => ({
  restaurantId: invoice.restaurantId || restaurantId || undefined,
  branchId: invoice.branchId || branchId || undefined,
  kind: invoice.kind || undefined,
});
