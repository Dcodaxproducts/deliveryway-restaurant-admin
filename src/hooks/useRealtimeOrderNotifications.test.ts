import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/constants", () => ({
  API_BASE_URL: "https://api.delivery-way.de/api/v1",
}));

import {
  buildOrderTrackingSocketAuth,
  getOrderTrackingSocketUrl,
} from "./useRealtimeOrderNotifications";

describe("getOrderTrackingSocketUrl", () => {
  it("builds the Socket.IO namespace URL from the API origin", () => {
    expect(getOrderTrackingSocketUrl()).toBe(
      "https://api.delivery-way.de/orders-tracking",
    );
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
