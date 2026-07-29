import type { StatItem } from "@/types/stats";
import { formatMoney, resolveCurrency } from "@/lib/currency";
import type { GeneratedInvoice } from "@/services/reports";

export type ReportTab = "financial" | "order" | "invoice-history";
export type ReportTranslate = (key: string) => string;

const RESTAURANT_BILLING_INVOICE_KINDS = new Set([
  "SUBSCRIPTION",
  "WEEKLY_PAYOUT",
]);

export const mergeRestaurantBillingInvoices = (
  ...invoiceLists: GeneratedInvoice[][]
) => {
  const invoicesById = new Map<string, GeneratedInvoice>();

  invoiceLists.flat().forEach((invoice) => {
    if (RESTAURANT_BILLING_INVOICE_KINDS.has(invoice.kind)) {
      invoicesById.set(invoice.id, invoice);
    }
  });

  return [...invoicesById.values()].sort(
    (left, right) =>
      new Date(right.createdAt ?? 0).getTime() -
      new Date(left.createdAt ?? 0).getTime(),
  );
};

export const getReportCurrency = (
  financialData: any,
  ordersData: any,
  fallbackCurrency?: string,
) =>
  resolveCurrency(
    financialData?.currency,
    ordersData?.currency,
    financialData?.transactions?.[0]?.currency,
    ordersData?.transactions?.[0]?.currency,
    fallbackCurrency,
  );

export const formatCurrency = (value: number, currency?: string | null) => {
  return formatMoney(value, currency);
};

const withNeutralTrend = (
  items: Array<Omit<StatItem, "trend">>,
  t: ReportTranslate,
): StatItem[] =>
  items.map((item) => ({
    ...item,
    trend: {
      direction: "up",
      percentage: t("live"),
    },
  }));

const getCountByKey = (
  list: { key: string; count: number }[] | undefined,
  keys: string[],
) => {
  const normalizedKeys = keys.map((key) => key.toUpperCase());

  return (
    list
      ?.filter((item) => normalizedKeys.includes(item.key?.toUpperCase()))
      .reduce((total, item) => total + Number(item.count || 0), 0) || 0
  );
};

export const buildFinancialStats = (
  financialData: any,
  currency: string,
  t: ReportTranslate,
): StatItem[] =>
  withNeutralTrend(
    [
      {
        _id: "financial-total-orders",
        title: t("stats.totalOrders"),
        value: String(financialData?.totalOrders ?? 0),
        icon: "orders",
      },
      {
        _id: "financial-gross-revenue",
        title: t("stats.grossRevenue"),
        value: formatCurrency(financialData?.grossRevenue ?? 0, currency),
        icon: "revenue",
      },
      {
        _id: "financial-paid-revenue",
        title: t("stats.paidRevenue"),
        value: formatCurrency(financialData?.paidRevenue ?? 0, currency),
        icon: "completed",
      },
      {
        _id: "financial-net-revenue",
        title: t("stats.netRevenue"),
        value: formatCurrency(financialData?.netRevenue ?? 0, currency),
        icon: "store",
      },
      {
        _id: "financial-average-order-value",
        title: t("stats.averageOrderValue"),
        value: formatCurrency(financialData?.averageOrderValue ?? 0, currency),
        icon: "users",
      },
      {
        _id: "financial-tax",
        title: t("stats.totalTax"),
        value: formatCurrency(financialData?.totalTax ?? 0, currency),
        icon: "revenue",
      },
      {
        _id: "financial-delivery-fee",
        title: t("stats.deliveryFee"),
        value: formatCurrency(financialData?.totalDeliveryFee ?? 0, currency),
        icon: "orders",
      },
      {
        _id: "financial-refunded",
        title: t("stats.refundedAmount"),
        value: formatCurrency(financialData?.refundedAmount ?? 0, currency),
        icon: "cancelled",
        iconStyle: "danger",
      },
    ],
    t,
  );

export const buildOrderReportStats = (
  ordersData: any,
  currency: string,
  t: ReportTranslate,
): StatItem[] => {
  const placedOrders = getCountByKey(ordersData?.statusBreakdown, ["PLACED"]);
  const ongoingOrders = getCountByKey(ordersData?.statusBreakdown, [
    "CONFIRMED",
    "PREPARING",
    "READY_FOR_PICKUP",
    "PICKED_UP",
    "READY_TO_SERVE",
    "OUT_FOR_DELIVERY",
  ]);
  const completedOrders = getCountByKey(ordersData?.statusBreakdown, [
    "DELIVERED",
    "SERVED",
    "COMPLETED",
  ]);
  const cancelledOrders = getCountByKey(ordersData?.statusBreakdown, [
    "CANCELLED",
    "REJECTED",
  ]);
  const paidOrders = getCountByKey(ordersData?.paymentStatusBreakdown, [
    "PAID",
  ]);
  const pendingPayments = getCountByKey(ordersData?.paymentStatusBreakdown, [
    "PENDING",
  ]);

  return withNeutralTrend(
    [
      {
        _id: "orders-total",
        title: t("stats.totalOrders"),
        value: String(ordersData?.totalOrders ?? 0),
        icon: "orders",
      },
      {
        _id: "orders-placed",
        title: t("stats.placedOrders"),
        value: String(placedOrders),
        icon: "ongoing",
      },
      {
        _id: "orders-ongoing",
        title: t("stats.ongoing"),
        value: String(ongoingOrders),
        icon: "ongoing",
      },
      {
        _id: "orders-completed",
        title: t("stats.completed"),
        value: String(completedOrders),
        icon: "completed",
      },
      {
        _id: "orders-cancelled",
        title: t("stats.cancelled"),
        value: String(cancelledOrders),
        icon: "cancelled",
        iconStyle: "danger",
      },
      {
        _id: "orders-total-revenue",
        title: t("stats.totalRevenue"),
        value: formatCurrency(ordersData?.totalRevenue ?? 0, currency),
        icon: "revenue",
      },
      {
        _id: "orders-paid",
        title: t("stats.paidOrders"),
        value: String(paidOrders),
        icon: "completed",
      },
      {
        _id: "orders-pending-payment",
        title: t("stats.pendingPayments"),
        value: String(pendingPayments),
        icon: "users",
      },
    ],
    t,
  );
};

export const getReportHeaderContent = (
  tab: ReportTab,
  isBranchAdmin: boolean,
  t: ReportTranslate,
) => {
  if (tab === "financial") {
    return {
      title: t(
        isBranchAdmin
          ? "headers.branchFinancialTitle"
          : "headers.financialTitle",
      ),
      description: t(
        isBranchAdmin
          ? "headers.branchFinancialDescription"
          : "headers.financialDescription",
      ),
    };
  }

  if (tab === "invoice-history") {
    return {
      title: t(
        isBranchAdmin ? "headers.branchBillingTitle" : "headers.billingTitle",
      ),
      description: t(
        isBranchAdmin
          ? "headers.branchBillingDescription"
          : "headers.billingDescription",
      ),
    };
  }

  return {
    title: t(isBranchAdmin ? "headers.branchOrderTitle" : "headers.orderTitle"),
    description: t(
      isBranchAdmin
        ? "headers.branchOrderDescription"
        : "headers.orderDescription",
    ),
  };
};
