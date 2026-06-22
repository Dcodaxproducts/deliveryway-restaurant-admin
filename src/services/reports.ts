import api from "@/lib/axios";

/**
 * ==============================
 * TYPES
 * ==============================
 */

export type BaseReportParams = {
  restaurantId?: string;
  branchId?: string;
};

export type ReportOrderStatus =
  | "PLACED"
  | "CONFIRMED"
  | "PREPARING"
  | "READY_FOR_PICKUP"
  | "PICKED_UP"
  | "READY_TO_SERVE"
  | "SERVED"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED"
  | "REJECTED";

export type ReportOrderType = "DELIVERY" | "TAKEAWAY" | "DINE_IN";

export type ReportPaymentStatus =
  | "PENDING"
  | "PAID"
  | "FAILED"
  | "CANCELLED"
  | "REFUNDED";

export type ReportKind = "order" | "group-orders";

export type OrdersReportParams = BaseReportParams & {
  fromDate?: string;
  toDate?: string;
  status?: ReportOrderStatus | string;
  orderType?: ReportOrderType | string;
  paymentStatus?: ReportPaymentStatus | string;
  kind?: ReportKind | string;
};

export type FinancialReportParams = BaseReportParams & {
  fromDate?: string;
  toDate?: string;
};

export type MenuExportReportParams = BaseReportParams & {
  categoryId?: string;
  menuId?: string;
  includeInactive?: boolean;
};

export type OrdersExportReportParams = BaseReportParams & {
  status?: ReportOrderStatus | string;
  orderType?: ReportOrderType | string;
  paymentStatus?: ReportPaymentStatus | string;
  kind?: ReportKind | string;
  fromDate?: string;
  toDate?: string;
};

export type CustomersExportReportParams = BaseReportParams & {
  isActive?: boolean;
  isVerified?: boolean;
  search?: string;
  fromDate?: string;
  toDate?: string;
};

/**
 * Kept for backward compatibility where existing components already import ExportReportParams.
 * Prefer using MenuExportReportParams, OrdersExportReportParams, or CustomersExportReportParams
 * in new code.
 */
export type ExportReportParams = BaseReportParams & {
  categoryId?: string;
  menuId?: string;
  includeInactive?: boolean;

  status?: ReportOrderStatus | string;
  orderType?: ReportOrderType | string;
  paymentStatus?: ReportPaymentStatus | string;
  kind?: ReportKind | string;

  isActive?: boolean;
  isVerified?: boolean;
  search?: string;

  fromDate?: string;
  toDate?: string;
};

export type CsvExportPayload = {
  fileName: string;
  mimeType: string;
  rowCount: number;
  content: string;
};

export type CsvExportResponse = {
  success: boolean;
  data: CsvExportPayload;
  message?: string;
};

export type InvoiceOrderStatus = ReportOrderStatus;

export type InvoiceOrderType = ReportOrderType;

export type InvoicePaymentStatus = ReportPaymentStatus;

export type InvoiceKind = ReportKind;

export type AdminInvoicesParams = BaseReportParams & {
  fromDate?: string;
  toDate?: string;
  status?: InvoiceOrderStatus | string;
  orderType?: InvoiceOrderType | string;
  paymentStatus?: InvoicePaymentStatus | string;
  kind?: InvoiceKind | string;
};

export type AdminInvoiceDetailsParams = BaseReportParams & {
  orderId: string;
};

export type ReportRestaurant = {
  id: string;
  name: string;
  slug?: string;
};

export type ReportBranch = {
  id: string;
  name: string;
};

export type ReportCustomer = {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  name?: string;
};

export type InvoiceTransaction = {
  id: string;
  type: string;
  status: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  providerRef?: string | null;
  processedAt?: string | null;
  createdAt?: string;
};

export type InvoiceItem = {
  id: string;
  menuItemId: string;
  menuItemName: string;
  variationId?: string | null;
  variationName?: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  note?: string | null;
  snapshotModifiers?: any[];
  createdAt?: string;
};

export type AdminInvoice = {
  invoiceNumber: string;
  orderId: string;

  restaurant: ReportRestaurant;
  branch: ReportBranch;
  customer: ReportCustomer;

  orderType: string;
  orderStatus: string;
  paymentStatus: string;
  paymentMethod: string;

  subtotal: number;
  taxAmount: number;
  deliveryFee: number;
  discountAmount: number;
  walletAppliedAmount: number;
  loyaltyDiscountAmount: number;
  totalAmount: number;
  currency?: string;

  paidAt?: string | null;
  issuedAt?: string | null;
  dueAt?: string | null;
  orderTime?: string | null;

  itemsCount: number;
  transactions: InvoiceTransaction[];

  tenantId?: string;
  couponCode?: string | null;
  items?: InvoiceItem[];
};

export type AdminInvoicesResponse = {
  success: boolean;
  data: AdminInvoice[];
  message?: string;
};

export type AdminInvoiceDetailsResponse = {
  success: boolean;
  data: AdminInvoice;
  message?: string;
};

/**
 * ==============================
 * HELPERS
 * ==============================
 */

const cleanParams = <T extends Record<string, any>>(params?: T) => {
  if (!params) return undefined;

  const cleaned = Object.fromEntries(
    Object.entries(params).filter(([, value]) => {
      return value !== undefined && value !== null && value !== "";
    })
  );

  return Object.keys(cleaned).length > 0 ? cleaned : undefined;
};

/**
 * ==============================
 * REPORT SUMMARY APIS
 * ==============================
 */

export const getOrdersReport = async (params?: OrdersReportParams) => {
  const { data } = await api.get("/admin/reports/orders", {
    params: cleanParams(params),
  });

  return data;
};

export const getFinancialReport = async (params?: FinancialReportParams) => {
  const { data } = await api.get("/admin/reports/financial", {
    params: cleanParams(params),
  });

  return data;
};

/**
 * ==============================
 * INVOICE REPORT APIS
 * ==============================
 */

export const getAdminReportInvoices = async (
  params?: AdminInvoicesParams
): Promise<AdminInvoicesResponse> => {
  const { data } = await api.get("/admin/reports/invoices", {
    params: cleanParams(params),
  });

  return data;
};

export const getAdminReportInvoiceDetails = async ({
  orderId,
  restaurantId,
  branchId,
}: AdminInvoiceDetailsParams): Promise<AdminInvoiceDetailsResponse> => {
  const { data } = await api.get(`/admin/reports/invoices/${orderId}`, {
    params: cleanParams({
      restaurantId,
      branchId,
    }),
  });

  return data;
};

/**
 * ==============================
 * EXPORT APIS
 * ==============================
 */

export const exportMenuReport = async (
  params?: MenuExportReportParams
): Promise<CsvExportResponse> => {
  const { data } = await api.get("/admin/reports/menu/export", {
    params: cleanParams(params),
  });

  return data;
};

export const exportOrdersReport = async (
  params?: OrdersExportReportParams
): Promise<CsvExportResponse> => {
  const { data } = await api.get("/admin/reports/orders/export", {
    params: cleanParams(params),
  });

  return data;
};

export const exportCustomersReport = async (
  params?: CustomersExportReportParams
): Promise<CsvExportResponse> => {
  const { data } = await api.get("/admin/reports/customers/export", {
    params: cleanParams(params),
  });

  return data;
};
