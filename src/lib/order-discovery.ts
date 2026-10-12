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
