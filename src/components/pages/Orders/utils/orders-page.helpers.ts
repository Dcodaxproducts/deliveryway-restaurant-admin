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

export const buildOrderStats = (orderStats: any): StatItem[] => {
  const paidOrders = countByStatus(orderStats?.paymentStatusBreakdown, "PAID");
  const cancelledOrders = countByStatus(orderStats?.statusBreakdown, "CANCELLED");

  return [
    {
      _id: "total-orders",
      title: "Total Orders",
      value: orderStats?.totalOrders ?? 0,
      icon: "orders",
      iconStyle: "default",
      trend: { direction: "up", percentage: `${orderStats?.totalOrders ?? 0}` },
    },
    {
      _id: "total-revenue",
      title: "Total Revenue",
      value: `${Number(orderStats?.totalRevenue ?? 0).toLocaleString()}`,
      icon: "revenue",
      iconStyle: "default",
      trend: {
        direction: "up",
        percentage: `Avg: ${Number(orderStats?.averageOrderValue ?? 0).toLocaleString()}`,
      },
    },
    {
      _id: "average-order-value",
      title: "Average Order Value",
      value: `${Number(orderStats?.averageOrderValue ?? 0).toLocaleString()}`,
      icon: "completed",
      iconStyle: "default",
      trend: { direction: "up", percentage: `${paidOrders} Paid` },
    },
    {
      _id: "cancelled-orders",
      title: "Cancelled Orders",
      value: cancelledOrders,
      icon: "cancelled",
      iconStyle: "danger",
      trend: {
        direction: cancelledOrders > 0 ? "down" : "up",
        percentage: `${cancelledOrders} Cancelled`,
      },
    },
  ] as StatItem[];
};

export const getOrdersHeaderContent = (tab: OrderTab, isBranchAdmin: boolean) => {
  switch (tab) {
    case "delivery":
      return {
        title: isBranchAdmin ? "Branch Delivery Orders" : "Delivery Orders",
        description: isBranchAdmin ? "View delivery orders for your assigned branch" : "View all delivery orders here",
      };
    case "pickup":
      return {
        title: isBranchAdmin ? "Branch Pick Up Orders" : "Pick Up Orders",
        description: isBranchAdmin ? "View pick up orders for your assigned branch" : "View all pick up orders here",
      };
    case "reservations":
      return { title: "Reservations", description: "View all reservations here" };
    case "group":
      return { title: "Group Order Summary", description: "View all group orders here" };
    default:
      return { title: "Order List", description: "View orders here" };
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
