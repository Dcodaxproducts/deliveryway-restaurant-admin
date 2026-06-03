export const ORDER_STATUS_LABEL_KEYS: Record<string, string> = {
  PLACED: "status.PLACED",
  CONFIRMED: "status.CONFIRMED",
  PREPARING: "status.PREPARING",
  READY: "status.READY",
  READY_FOR_PICKUP: "status.READY",
  PICKED_UP: "status.PICKED_UP",
  READY_TO_SERVE: "status.READY",
  SERVED: "status.SERVED",
  OUT_FOR_DELIVERY: "status.OUT_FOR_DELIVERY",
  ON_DELIVERY: "status.OUT_FOR_DELIVERY",
  DELIVERED: "status.DELIVERED",
  CANCELLED: "status.CANCELLED",
  REJECTED: "status.REJECTED",
};

export const TABLE_RESERVATION_STATUS_LABEL_KEYS: Record<string, string> = {
  REQUESTED: "status.REQUESTED",
  CONFIRMED: "status.CONFIRMED",
  SEATED: "status.SEATED",
  COMPLETED: "status.COMPLETED",
  CANCELLED: "status.CANCELLED",
  NO_SHOW: "status.NO_SHOW",
};
