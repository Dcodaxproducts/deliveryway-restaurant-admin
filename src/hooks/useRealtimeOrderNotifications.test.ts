import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/constants", () => ({
  API_BASE_URL: "https://api.delivery-way.de/api/v1",
}));

import {
  getNewOrderToastId,
  shouldDismissNewOrderToast,
} from "@/hooks/realtime-order-state";

import { buildAutoOpenOrderPath } from "@/lib/new-order-navigation";
import {
  buildOrderTrackingSocketAuth,
  getOrderTrackingSocketUrl,
  isPendingOrderAlertStatus,
  isScopedOrderStatusUpdate,
  playNewOrderSound,
  silenceOrderAlert,
  startRepeatingOrderSound,
  unlockOrderNotificationSound,
} from "./useRealtimeOrderNotifications";

describe("getOrderTrackingSocketUrl", () => {
  it("builds the Socket.IO namespace URL from the API origin", () => {
    expect(getOrderTrackingSocketUrl()).toBe(
      "https://api.delivery-way.de/orders-tracking",
    );
  });
});

describe("realtime order notification state", () => {
  it("uses one stable popup id for immediate and scheduled order events", () => {
    expect(getNewOrderToastId("order-immediate")).toBe(
      "new-order:order-immediate",
    );
    expect(getNewOrderToastId("order-scheduled")).toBe(
      "new-order:order-scheduled",
    );
  });

  it("keeps a placed popup visible until another device changes status", () => {
    expect(shouldDismissNewOrderToast("PLACED")).toBe(false);
    expect(shouldDismissNewOrderToast("CONFIRMED")).toBe(true);
    expect(shouldDismissNewOrderToast("CANCELLED")).toBe(true);
  });
});

describe("new order navigation", () => {
  it("requests the acceptance dialog on the order details route", () => {
    expect(buildAutoOpenOrderPath("order-123")).toBe(
      "/orders/details/order-123?acceptOrder=1",
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

describe("silenceOrderAlert", () => {
  it("dispatches the order-specific dismiss event", () => {
    const dispatchEvent = vi.fn();
    vi.stubGlobal("window", { dispatchEvent });

    silenceOrderAlert("order-1");

    expect(dispatchEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "deliveryways:order-alert-dismiss",
        detail: { orderId: "order-1" },
      }),
    );
    vi.unstubAllGlobals();
  });
});

describe("order notification sound", () => {
  it("replaces only the existing sound timer and keeps ringing every three seconds", () => {
    const intervals = new Map([["order-1", 11]]);
    const playSound = vi.fn();
    const clear = vi.fn();
    const schedule = vi.fn((callback: () => void, delayMs: number) => {
      expect(delayMs).toBe(3_000);
      callback();
      return 22;
    });

    startRepeatingOrderSound({
      orderId: "order-1",
      intervals,
      enabled: true,
      playSound,
      schedule,
      clear,
    });

    expect(clear).toHaveBeenCalledWith(11);
    expect(playSound).toHaveBeenCalledTimes(2);
    expect(intervals.get("order-1")).toBe(22);
  });

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
