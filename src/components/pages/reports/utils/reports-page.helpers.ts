import type { StatItem } from "@/types/stats";

export type ReportTab = "financial" | "order";

export const getReportCurrency = (financialData: any, ordersData: any) =>
  financialData?.currency ||
  ordersData?.currency ||
  financialData?.transactions?.[0]?.currency ||
  ordersData?.transactions?.[0]?.currency ||
  "EUR";

export const formatCurrency = (value: number, currency = "EUR") => {
  const numericValue = Number(value || 0);

  try {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(numericValue);
  } catch {
    return `${currency} ${numericValue.toFixed(2)}`;
  }
};

const withNeutralTrend = (items: Array<Omit<StatItem, "trend">>): StatItem[] =>
  items.map((item) => ({
    ...item,
    trend: {
      direction: "up",
      percentage: "Live",
    },
  }));

const getCountByKey = (
  list: { key: string; count: number }[] | undefined,
  keys: string[]
) => {
  const normalizedKeys = keys.map((key) => key.toUpperCase());

  return (
    list
      ?.filter((item) => normalizedKeys.includes(item.key?.toUpperCase()))
      .reduce((total, item) => total + Number(item.count || 0), 0) || 0
  );
};

export const buildFinancialStats = (financialData: any, currency: string): StatItem[] =>
  withNeutralTrend([
    {
      _id: "financial-total-orders",
      title: "Total Orders",
      value: String(financialData?.totalOrders ?? 0),
      icon: "orders",
    },
    {
      _id: "financial-gross-revenue",
      title: "Gross Revenue",
      value: formatCurrency(financialData?.grossRevenue ?? 0, currency),
      icon: "revenue",
    },
    {
      _id: "financial-paid-revenue",
      title: "Paid Revenue",
      value: formatCurrency(financialData?.paidRevenue ?? 0, currency),
      icon: "completed",
    },
    {
      _id: "financial-net-revenue",
      title: "Net Revenue",
      value: formatCurrency(financialData?.netRevenue ?? 0, currency),
      icon: "store",
    },
    {
      _id: "financial-average-order-value",
      title: "Average Order Value",
      value: formatCurrency(financialData?.averageOrderValue ?? 0, currency),
      icon: "users",
    },
    {
      _id: "financial-tax",
      title: "Total Tax",
      value: formatCurrency(financialData?.totalTax ?? 0, currency),
      icon: "revenue",
    },
    {
      _id: "financial-delivery-fee",
      title: "Delivery Fee",
      value: formatCurrency(financialData?.totalDeliveryFee ?? 0, currency),
      icon: "orders",
    },
    {
      _id: "financial-refunded",
      title: "Refunded Amount",
      value: formatCurrency(financialData?.refundedAmount ?? 0, currency),
      icon: "cancelled",
      iconStyle: "danger",
    },
  ]);

export const buildOrderReportStats = (ordersData: any, currency: string): StatItem[] => {
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
  const paidOrders = getCountByKey(ordersData?.paymentStatusBreakdown, ["PAID"]);
  const pendingPayments = getCountByKey(ordersData?.paymentStatusBreakdown, ["PENDING"]);

  return withNeutralTrend([
    { _id: "orders-total", title: "Total Orders", value: String(ordersData?.totalOrders ?? 0), icon: "orders" },
    { _id: "orders-placed", title: "Placed Orders", value: String(placedOrders), icon: "ongoing" },
    { _id: "orders-ongoing", title: "Ongoing", value: String(ongoingOrders), icon: "ongoing" },
    { _id: "orders-completed", title: "Completed", value: String(completedOrders), icon: "completed" },
    { _id: "orders-cancelled", title: "Cancelled", value: String(cancelledOrders), icon: "cancelled", iconStyle: "danger" },
    { _id: "orders-total-revenue", title: "Total Revenue", value: formatCurrency(ordersData?.totalRevenue ?? 0, currency), icon: "revenue" },
    { _id: "orders-paid", title: "Paid Orders", value: String(paidOrders), icon: "completed" },
    { _id: "orders-pending-payment", title: "Pending Payments", value: String(pendingPayments), icon: "users" },
  ]);
};

export const getReportHeaderContent = (tab: ReportTab, isBranchAdmin: boolean) => {
  if (tab === "financial") {
    return {
      title: isBranchAdmin ? "Branch Financial Report" : "Financial Report",
      description: isBranchAdmin ? "View financial data for your assigned branch" : "Manage and view all financial data in one place",
    };
  }

  return {
    title: isBranchAdmin ? "Branch Order Report" : "Order Report",
    description: isBranchAdmin ? "View order analytics for your assigned branch" : "Manage and view all orders in one place",
  };
};
