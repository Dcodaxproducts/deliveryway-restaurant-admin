import type { Order } from "@/types/orders";

const MAX_SEEN_ORDER_IDS = 500;

export function updateOrderDiscoverySnapshot(
  currentOrders: Order[],
  seenOrderIds: Set<string>,
  initialized: boolean,
) {
  const newOrders = initialized
    ? currentOrders.filter((order) => !seenOrderIds.has(order.id))
    : [];

  for (const order of currentOrders) {
    seenOrderIds.add(order.id);
  }
  while (seenOrderIds.size > MAX_SEEN_ORDER_IDS) {
    const oldestOrderId = seenOrderIds.values().next().value;
    if (!oldestOrderId) break;
    seenOrderIds.delete(oldestOrderId);
  }

  return newOrders;
}

export function updateOrderStatusSnapshot(
  currentOrders: Order[],
  knownStatuses: Map<string, string>,
  initialized: boolean,
) {
  const changedOrders = initialized
    ? currentOrders.filter((order) => {
        const previousStatus = knownStatuses.get(order.id);
        return previousStatus !== undefined && previousStatus !== order.status;
      })
    : [];

  for (const order of currentOrders) {
    knownStatuses.set(order.id, order.status);
  }
  while (knownStatuses.size > MAX_SEEN_ORDER_IDS) {
    const oldestOrderId = knownStatuses.keys().next().value;
    if (!oldestOrderId) break;
    knownStatuses.delete(oldestOrderId);
  }

  return changedOrders;
}
