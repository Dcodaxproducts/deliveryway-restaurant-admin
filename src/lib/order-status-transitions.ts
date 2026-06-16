type SupportedOrderType = "DELIVERY" | "TAKEAWAY" | "DINE_IN";

type StatusTransitionMap = Record<SupportedOrderType, Record<string, string>>;

type OrderTransitionInput = {
  orderType?: string | null;
  status?: string | null;
  deliveryOtp?: string | null;
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

export const ORDER_TERMINAL_ACTION_LABEL_KEYS: Record<string, string> = {
  CANCELLED: "statusAction.CANCELLED",
  REJECTED: "statusAction.REJECTED",
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

export const requiresOrderTimeForStatusTransition = (
  order: OrderTransitionInput | null | undefined,
  nextStatus?: string
) => {
  return (
    normalizeValue(order?.status) === "PLACED" &&
    normalizeValue(nextStatus) === "CONFIRMED"
  );
};

export const canDirectlyUpdateOrderStatus = (
  order: OrderTransitionInput | null | undefined
) => {
  const nextStatus = getNextOrderStatus(order);

  if (!nextStatus) {
    return false;
  }

  if (requiresOrderTimeForStatusTransition(order, nextStatus)) {
    return false;
  }

  if (requiresDeliveryOtpForStatusTransition(order, nextStatus)) {
    return Boolean(order?.deliveryOtp?.trim());
  }

  return true;
};

export const canTerminateOrderStatus = (
  order: OrderTransitionInput | null | undefined
) => {
  const status = normalizeValue(order?.status);

  return Boolean(status && !ORDER_TERMINAL_STATUSES.has(status));
};

export const getOrderStatusProgressSteps = ({
  orderType,
  previousStatus,
  status,
}: {
  orderType?: string | null;
  previousStatus?: string | null;
  status?: string | null;
}) => {
  const normalizedOrderType = normalizeValue(orderType);
  const normalizedPreviousStatus = normalizeValue(previousStatus);
  const normalizedStatus = normalizeValue(status);

  if (!normalizedStatus) {
    return [];
  }

  if (
    normalizedOrderType !== "DELIVERY" &&
    normalizedOrderType !== "TAKEAWAY" &&
    normalizedOrderType !== "DINE_IN"
  ) {
    return [normalizedStatus];
  }

  const flow = Object.keys(NEXT_STATUS_BY_ORDER_TYPE[normalizedOrderType]);
  const lastFlowStatus = flow[flow.length - 1] ?? "";
  const finalStatus = NEXT_STATUS_BY_ORDER_TYPE[normalizedOrderType][lastFlowStatus];
  const fullFlow = finalStatus ? [...flow, finalStatus] : flow;

  if (normalizedStatus === "CANCELLED" || normalizedStatus === "REJECTED") {
    const previousIndex = normalizedPreviousStatus
      ? fullFlow.indexOf(normalizedPreviousStatus)
      : -1;
    const coveredSteps = previousIndex >= 0
      ? fullFlow.slice(0, previousIndex + 1)
      : ["PLACED"];

    return [...coveredSteps, normalizedStatus];
  }

  const statusIndex = fullFlow.indexOf(normalizedStatus);

  if (statusIndex === -1) {
    return [normalizedStatus];
  }

  return fullFlow.slice(0, statusIndex + 1);
};
