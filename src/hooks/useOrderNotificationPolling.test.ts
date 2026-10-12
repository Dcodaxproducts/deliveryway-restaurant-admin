import { describe, expect, it } from "vitest";

import {
  updateOrderDiscoverySnapshot,
  updateOrderStatusSnapshot,
} from "@/lib/order-discovery";
import type { Order } from "@/types/orders";

const order = (id: string): Order => ({
  id,
  orderType: "DELIVERY",
  status: "PLACED",
  createdAt: "2026-10-12T00:00:00.000Z",
});

describe("updateOrderDiscoverySnapshot", () => {
  it("uses the initial response as a baseline and discovers later orders", () => {
    const seen = new Set<string>();

    expect(
      updateOrderDiscoverySnapshot([order("one"), order("two")], seen, false),
    ).toEqual([]);
    expect(
      updateOrderDiscoverySnapshot(
        [order("three"), order("one"), order("two")],
        seen,
        true,
      ).map(({ id }) => id),
    ).toEqual(["three"]);
  });

  it("keeps discovery memory bounded", () => {
    const seen = new Set<string>();
    const orders = Array.from({ length: 600 }, (_, index) =>
      order(String(index)),
    );

    updateOrderDiscoverySnapshot(orders, seen, false);

    expect(seen.size).toBe(500);
    expect(seen.has("0")).toBe(false);
    expect(seen.has("599")).toBe(true);
  });
});


describe("updateOrderStatusSnapshot", () => {
  it("reports only status transitions after the initial baseline", () => {
    const statuses = new Map<string, string>();

    expect(updateOrderStatusSnapshot([order("one")], statuses, false)).toEqual([]);
    expect(updateOrderStatusSnapshot([order("one")], statuses, true)).toEqual([]);

    const confirmed = { ...order("one"), status: "CONFIRMED" };
    expect(updateOrderStatusSnapshot([confirmed], statuses, true)).toEqual([
      confirmed,
    ]);
  });
});
