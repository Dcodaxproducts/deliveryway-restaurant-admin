import type { Order } from "@/types/orders";

export type OrdersScheduleFilter =
  | "ALL"
  | "PREORDERS"
  | "TODAY_SCHEDULED"
  | "PAST_SCHEDULED"
  | "CUSTOM_RANGE";

export type OrdersScheduleDateRange = {
  from?: Date;
  to?: Date;
};

const startOfDay = (date: Date) => {
  const nextDate = new Date(date);
  nextDate.setHours(0, 0, 0, 0);
  return nextDate;
};

const endOfDay = (date: Date) => {
  const nextDate = new Date(date);
  nextDate.setHours(23, 59, 59, 999);
  return nextDate;
};

export const getOrderTimeDate = (order: Pick<Order, "orderTime">) => {
  if (!order.orderTime) return null;

  const orderTime = new Date(order.orderTime);
  return Number.isNaN(orderTime.getTime()) ? null : orderTime;
};

export const isFutureOrder = (
  order: Pick<Order, "isScheduled" | "orderTime">,
  now: Date = new Date()
) => {
  if (order.isScheduled) return true;

  const orderTime = getOrderTimeDate(order);
  return Boolean(orderTime && orderTime.getTime() > now.getTime());
};

const isScheduledOrder = (
  order: Pick<Order, "isScheduled" | "orderTime">,
  now: Date
) => {
  return Boolean(order.isScheduled || getOrderTimeDate(order) || isFutureOrder(order, now));
};

const isWithinRange = (
  orderTime: Date | null,
  range: OrdersScheduleDateRange
) => {
  if (!orderTime) return false;

  const from = range.from ? startOfDay(range.from) : undefined;
  const to = range.to ? endOfDay(range.to) : undefined;

  if (from && orderTime.getTime() < from.getTime()) return false;
  if (to && orderTime.getTime() > to.getTime()) return false;

  return true;
};

export const matchesOrdersScheduleFilter = (
  order: Pick<Order, "isScheduled" | "orderTime">,
  filter: OrdersScheduleFilter,
  range: OrdersScheduleDateRange = {},
  now: Date = new Date()
) => {
  if (filter === "ALL") return true;

  const orderTime = getOrderTimeDate(order);

  if (filter === "PREORDERS") {
    return isFutureOrder(order, now);
  }

  if (filter === "TODAY_SCHEDULED") {
    return isScheduledOrder(order, now) && isWithinRange(orderTime, {
      from: now,
      to: now,
    });
  }

  if (filter === "PAST_SCHEDULED") {
    return Boolean(
      isScheduledOrder(order, now) &&
        orderTime &&
        orderTime.getTime() < now.getTime()
    );
  }

  return isWithinRange(orderTime, range);
};
