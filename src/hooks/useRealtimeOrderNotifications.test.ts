import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/constants", () => ({
  API_BASE_URL: "https://api.delivery-way.de/api/v1",
}));

import {
  buildOrderTrackingSocketAuth,
  getOrderTrackingSocketUrl,
  isPendingOrderAlertStatus,
  isScopedOrderStatusUpdate,
  playNewOrderSound,
  unlockOrderNotificationSound,
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

describe("isScopedOrderStatusUpdate", () => {
  const payload = {
    id: "order-1",
    status: "CONFIRMED",
    restaurantId: "restaurant-1",
    branchId: "branch-1",
  };

  it("accepts the restaurant event for a restaurant admin", () => {
    expect(
      isScopedOrderStatusUpdate({
        payload,
        restaurantId: "restaurant-1",
        isBranchAdmin: false,
      }),
    ).toBe(true);
  });

  it("requires the matching branch for a branch admin", () => {
    expect(
      isScopedOrderStatusUpdate({
        payload,
        restaurantId: "restaurant-1",
        branchId: "branch-2",
        isBranchAdmin: true,
      }),
    ).toBe(false);
  });
});

describe("order notification sound", () => {
  it("unlocks and reuses one audio context before playing the alert", async () => {
    const resume = vi.fn().mockResolvedValue(undefined);
    const start = vi.fn();
    const stop = vi.fn();
    const connect = vi.fn();
    const setValueAtTime = vi.fn();
    const exponentialRampToValueAtTime = vi.fn();
    const createOscillator = vi.fn(() => ({
      frequency: { setValueAtTime },
      connect,
      start,
      stop,
    }));
    const createGain = vi.fn(() => ({
      gain: { setValueAtTime, exponentialRampToValueAtTime },
      connect,
    }));
    const audioContext = {
      state: "suspended",
      currentTime: 1,
      destination: {},
      resume: vi.fn(async () => {
        audioContext.state = "running";
        await resume();
      }),
      createOscillator,
      createGain,
    };
    const AudioContextMock = vi.fn(function AudioContextMock() {
      return audioContext;
    });
    vi.stubGlobal("window", { AudioContext: AudioContextMock });

    await unlockOrderNotificationSound();
    await playNewOrderSound();
    await playNewOrderSound();

    expect(AudioContextMock).toHaveBeenCalledTimes(1);
    expect(resume).toHaveBeenCalledTimes(1);
    expect(createOscillator).toHaveBeenCalledTimes(2);
    expect(start).toHaveBeenCalledTimes(2);
    expect(stop).toHaveBeenCalledTimes(2);

    vi.unstubAllGlobals();
  });
});
