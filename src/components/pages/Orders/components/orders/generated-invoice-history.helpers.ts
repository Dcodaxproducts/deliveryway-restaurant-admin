import type {
  GeneratedInvoice,
  GeneratedInvoicesParams,
} from "@/services/reports";

export const BILLING_INVOICE_KINDS = ["SUBSCRIPTION", "WEEKLY_PAYOUT"] as const;
export type BillingInvoiceKind = (typeof BILLING_INVOICE_KINDS)[number];
export const BILLING_INVOICE_PAGE_LIMIT = 50;

export const hasBillingInvoiceQueryError = (
  queries: ReadonlyArray<{ isError: boolean }>,
) => queries.some((query) => query.isError);
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
  // Keep the calendar date intact. The API owns restaurant-local inclusive-end conversion.
  toDate: filters.toDate || undefined,
  limit: BILLING_INVOICE_PAGE_LIMIT,
});

export const buildBillingInvoiceRequests = (scope: {
  filters: BillingInvoiceFilters;
  restaurantId?: string | null;
  branchId?: string | null;
}): GeneratedInvoicesParams[] => {
  const base = buildBillingInvoiceParams(scope);
  const kinds =
    scope.filters.kind === "ALL" ? BILLING_INVOICE_KINDS : [scope.filters.kind];
  return kinds.map((kind) => ({ ...base, kind }));
};

export const isRestaurantBillingInvoice = (invoice: GeneratedInvoice) =>
  BILLING_INVOICE_KINDS.includes(invoice.kind as BillingInvoiceKind);

export const mergeBillingInvoices = (
  pages: Array<GeneratedInvoice[] | undefined>,
) => {
  const unique = new Map<string, GeneratedInvoice>();
  pages
    .flatMap((page) => page ?? [])
    .forEach((invoice) => {
      if (isRestaurantBillingInvoice(invoice)) unique.set(invoice.id, invoice);
    });
  return [...unique.values()].sort((left, right) => {
    const dateOrder = String(
      right.createdAt ?? right.generatedAt ?? "",
    ).localeCompare(String(left.createdAt ?? left.generatedAt ?? ""));
    return dateOrder || left.id.localeCompare(right.id);
  });
};

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
) =>
  invoice[`${key}Snapshot`]?.name ||
  invoice[key]?.name ||
  (key === "branch" ? invoice.branchId : null) ||
  "-";

export const getInvoiceLinkedRecord = (invoice: GeneratedInvoice) => {
  if (invoice.orderId) return { type: "order" as const, id: invoice.orderId };
  if (invoice.subscriptionId)
    return { type: "subscription" as const, id: invoice.subscriptionId };
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
