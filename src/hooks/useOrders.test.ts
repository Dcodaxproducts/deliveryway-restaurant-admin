import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/constants", () => ({
  API_BASE_URL: "https://api.delivery-way.de/api/v1",
}));

import { shouldPrintAcceptedOrder } from "@/hooks/useOrders";

describe("accepted-order printing decision", () => {
  it("prints confirmed orders for POS printer sessions", () => {
    expect(
      shouldPrintAcceptedOrder({
        status: "CONFIRMED",
        restaurantId: "restaurant-1",
        isPosPrinter: true,
      }),
    ).toBe(true);
  });

  it("does not print non-confirmed orders or orders without restaurant scope", () => {
    expect(
      shouldPrintAcceptedOrder({
        status: "PREPARING",
        restaurantId: "restaurant-1",
        isPosPrinter: true,
      }),
    ).toBe(false);
    expect(
      shouldPrintAcceptedOrder({
        status: "CONFIRMED",
        restaurantId: undefined,
        isPosPrinter: true,
      }),
    ).toBe(false);
  });
});
