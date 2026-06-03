import type { StatItem } from "@/types/stats";

export type OrderTab = "delivery" | "pickup" | "reservations" | "group";

export interface Order {
  id: string;
  orderType?: string;
  status?: string;
  totalAmount?: number;
  createdAt?: string;
  isReservation?: boolean;
  guestCount?: number;
  reservationDate?: string;
  customerName?: string;
}

const countByStatus = (list: any[] | undefined, status: string) =>
  list?.find((item: any) => item.status?.toUpperCase() === status)?.count ?? 0;

type Translate = (key: string, values?: Record<string, string | number>) => string;

export const buildOrderStats = (orderStats: any, t: Translate): StatItem[] => {
  const paidOrders = countByStatus(orderStats?.paymentStatusBreakdown, "PAID");
  const cancelledOrders = countByStatus(orderStats?.statusBreakdown, "CANCELLED");

  return [
    {
      _id: "total-orders",
      title: t("totalOrders"),
      value: orderStats?.totalOrders ?? 0,
      icon: "orders",
      iconStyle: "default",
      trend: { direction: "up", percentage: `${orderStats?.totalOrders ?? 0}` },
    },
    {
      _id: "total-revenue",
      title: t("totalRevenue"),
      value: `${Number(orderStats?.totalRevenue ?? 0).toLocaleString()}`,
      icon: "revenue",
      iconStyle: "default",
      trend: {
        direction: "up",
        percentage: t("averagePrefix", { value: Number(orderStats?.averageOrderValue ?? 0).toLocaleString() }),
      },
    },
    {
      _id: "average-order-value",
      title: t("averageOrderValue"),
      value: `${Number(orderStats?.averageOrderValue ?? 0).toLocaleString()}`,
      icon: "completed",
      iconStyle: "default",
      trend: { direction: "up", percentage: t("paidCount", { count: paidOrders }) },
    },
    {
      _id: "cancelled-orders",
      title: t("cancelledOrders"),
      value: cancelledOrders,
      icon: "cancelled",
      iconStyle: "danger",
      trend: {
        direction: cancelledOrders > 0 ? "down" : "up",
        percentage: t("cancelledCount", { count: cancelledOrders }),
      },
    },
  ] as StatItem[];
};

export const getOrdersHeaderContent = (tab: OrderTab, isBranchAdmin: boolean, t: Translate) => {
  switch (tab) {
    case "delivery":
      return {
        title: isBranchAdmin ? t("branchDeliveryOrders") : t("deliveryOrders"),
        description: isBranchAdmin ? t("deliveryDescription") : t("description"),
      };
    case "pickup":
      return {
        title: isBranchAdmin ? t("branchPickupOrders") : t("pickupOrders"),
        description: isBranchAdmin ? t("pickupDescription") : t("pickupOrdersDescription"),
      };
    case "reservations":
      return { title: t("reservationsTitle"), description: t("reservationsDescription") };
    case "group":
      return { title: t("groupOrderSummaryTitle"), description: t("groupOrderSummaryDescription") };
    default:
      return { title: t("orderList"), description: t("orderListDescription") };
  }
};

export const mapReservationToOrder = (reservation: any): Order => ({
  id: reservation.id,
  status: reservation.status,
  createdAt: reservation.createdAt,
  reservationDate: reservation.reservationDate,
  guestCount: reservation.guestCount,
  isReservation: true,
  customerName: `${reservation.customer?.firstName || ""} ${reservation.customer?.lastName || ""}`.trim(),
});
