import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/constants", () => ({
  API_BASE_URL: "https://api.delivery-way.de/api/v1",
}));

import {
  buildOrderTrackingSocketAuth,
  getOrderTrackingSocketUrl,
  isPendingOrderAlertStatus,
} from "./useRealtimeOrderNotifications";

describe("getOrderTrackingSocketUrl", () => {
  it("builds the Socket.IO namespace URL from the API origin", () => {
    expect(getOrderTrackingSocketUrl()).toBe(
      "https://api.delivery-way.de/orders-tracking",
    );
  });
});

describe("isPendingOrderAlertStatus", () => {
  it("rings only while an order awaits acceptance", () => {
    expect(isPendingOrderAlertStatus("PLACED")).toBe(true);
    expect(isPendingOrderAlertStatus("CONFIRMED")).toBe(false);
    expect(isPendingOrderAlertStatus("REJECTED")).toBe(false);
  });
});

describe("buildOrderTrackingSocketAuth", () => {
  it("sends the selected restaurant and branch with the access token", () => {
    expect(
      buildOrderTrackingSocketAuth({
        token: "access-token",
        restaurantId: "restaurant-1",
        branchId: "branch-1",
      }),
    ).toEqual({
      token: "access-token",
      restaurantId: "restaurant-1",
      branchId: "branch-1",
    });
  });

  it("omits an empty branch for restaurant administrators", () => {
    expect(
      buildOrderTrackingSocketAuth({
        token: "access-token",
        restaurantId: "restaurant-1",
      }),
    ).toEqual({
      token: "access-token",
      restaurantId: "restaurant-1",
    });
  });
});
