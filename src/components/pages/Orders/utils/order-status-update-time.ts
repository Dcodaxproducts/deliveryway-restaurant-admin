type OrderStatusTimeSource = {
  status?: string | null;
  orderTime?: string | null;
  isScheduled?: boolean | null;
};

type ResolveStatusUpdateOrderTimeInput = {
  canEditDeliveryTime: boolean;
  deliveryTime: Date;
  order: OrderStatusTimeSource | null;
  selectedStatus?: string | null;
};

export const parseOrderTime = (value?: string | null) => {
  if (!value) return null;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const shouldPreserveScheduledOrderTime = (
  order: OrderStatusTimeSource | null,
  selectedStatus?: string | null
) => {
  return Boolean(
    order?.status === "PLACED" &&
      selectedStatus === "CONFIRMED" &&
      order.isScheduled &&
      parseOrderTime(order.orderTime)
  );
};

export const resolveStatusUpdateOrderTime = ({
  canEditDeliveryTime,
  deliveryTime,
  order,
  selectedStatus,
}: ResolveStatusUpdateOrderTimeInput) => {
  if (shouldPreserveScheduledOrderTime(order, selectedStatus)) {
    return parseOrderTime(order?.orderTime)?.toISOString();
  }

  if (canEditDeliveryTime) {
    return deliveryTime.toISOString();
  }

  return undefined;
};
