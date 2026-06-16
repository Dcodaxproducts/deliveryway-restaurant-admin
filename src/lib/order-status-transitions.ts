type SupportedOrderType = "DELIVERY" | "TAKEAWAY" | "DINE_IN";

type StatusTransitionMap = Record<SupportedOrderType, Record<string, string>>;

type OrderTransitionInput = {
  orderType?: string | null;
  status?: string | null;
};

export const ORDER_TERMINAL_STATUSES = new Set([
  "CANCELLED",
  "REJECTED",
  "DELIVERED",
  "PICKED_UP",
  "SERVED",
]);

export const NEXT_STATUS_BY_ORDER_TYPE: StatusTransitionMap = {
  DELIVERY: {
    PLACED: "CONFIRMED",
    CONFIRMED: "PREPARING",
    PREPARING: "OUT_FOR_DELIVERY",
    OUT_FOR_DELIVERY: "DELIVERED",
  },
  TAKEAWAY: {
    PLACED: "CONFIRMED",
    CONFIRMED: "PREPARING",
    PREPARING: "READY_FOR_PICKUP",
    READY_FOR_PICKUP: "PICKED_UP",
  },
  DINE_IN: {
    PLACED: "CONFIRMED",
    CONFIRMED: "PREPARING",
    PREPARING: "READY_TO_SERVE",
    READY_TO_SERVE: "SERVED",
  },
};

export const ORDER_STATUS_ACTION_LABEL_KEYS: Record<string, string> = {
  CONFIRMED: "statusAction.CONFIRMED",
  PREPARING: "statusAction.PREPARING",
  OUT_FOR_DELIVERY: "statusAction.OUT_FOR_DELIVERY",
  READY_FOR_PICKUP: "statusAction.READY_FOR_PICKUP",
  PICKED_UP: "statusAction.PICKED_UP",
  READY_TO_SERVE: "statusAction.READY_TO_SERVE",
  SERVED: "statusAction.SERVED",
  DELIVERED: "statusAction.DELIVERED",
};

const normalizeValue = (value?: string | null) => value?.trim().toUpperCase();

export const getNextOrderStatus = (
  order?: OrderTransitionInput | null
) => {
  const orderType = normalizeValue(order?.orderType);
  const status = normalizeValue(order?.status);

  if (!orderType || !status || ORDER_TERMINAL_STATUSES.has(status)) {
    return undefined;
  }

  if (
    orderType !== "DELIVERY" &&
    orderType !== "TAKEAWAY" &&
    orderType !== "DINE_IN"
  ) {
    return undefined;
  }

  return NEXT_STATUS_BY_ORDER_TYPE[orderType][status];
};

export const requiresDeliveryOtpForStatusTransition = (
  order: OrderTransitionInput | null | undefined,
  nextStatus?: string
) => {
  return (
    normalizeValue(order?.orderType) === "DELIVERY" &&
    normalizeValue(order?.status) === "OUT_FOR_DELIVERY" &&
    normalizeValue(nextStatus) === "DELIVERED"
  );
};
