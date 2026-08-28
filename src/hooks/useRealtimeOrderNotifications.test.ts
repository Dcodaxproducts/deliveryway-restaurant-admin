import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/constants", () => ({
  API_BASE_URL: "https://api.delivery-way.de/api/v1",
}));

import {
  getNewOrderToastId,
  shouldDismissNewOrderToast,
} from "@/hooks/realtime-order-state";

import {
  buildAutoOpenOrderPath,
  shouldSilenceOrderAlertOnDetailsOpen,
} from "@/lib/new-order-navigation";
import {
  buildOrderTrackingSocketAuth,
  getOrderTrackingSocketUrl,
  getOrderSoundMode,
  isPendingOrderAlertStatus,
  isScopedOrderStatusUpdate,
  playNewOrderSound,
  registerOrderSoundUnlockListeners,
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

  it("keeps the alert ringing when realtime delivery auto-opens order details", () => {
    expect(shouldSilenceOrderAlertOnDetailsOpen("1")).toBe(false);
    expect(shouldSilenceOrderAlertOnDetailsOpen(null)).toBe(true);
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
      repeat: true,
      playSound,
      schedule,
      clear,
    });

    expect(clear).toHaveBeenCalledWith(11);
    expect(playSound).toHaveBeenCalledTimes(2);
    expect(intervals.get("order-1")).toBe(22);
  });

  it("rings once without scheduling a repeat when configured", () => {
    const intervals = new Map([["order-1", 11]]);
    const playSound = vi.fn();
    const clear = vi.fn();
    const schedule = vi.fn();

    startRepeatingOrderSound({
      orderId: "order-1",
      intervals,
      enabled: true,
      repeat: false,
      playSound,
      schedule,
      clear,
    });

    expect(clear).toHaveBeenCalledWith(11);
    expect(playSound).toHaveBeenCalledTimes(1);
    expect(schedule).not.toHaveBeenCalled();
    expect(intervals.has("order-1")).toBe(false);
  });

  it("unlocks and reuses the configured notification audio", async () => {
    const play = vi.fn().mockResolvedValue(undefined);
    const pause = vi.fn();
    const audio = { play, pause, currentTime: 10, muted: false, preload: "" };
    const AudioMock = vi.fn(function AudioMock() {
      return audio;
    });
    vi.stubGlobal("Audio", AudioMock);

    await unlockOrderNotificationSound();
    await playNewOrderSound();
    await playNewOrderSound();

    expect(AudioMock).toHaveBeenCalledTimes(1);
    expect(AudioMock).toHaveBeenCalledWith(
      "/sounds/mixkit-bell-notification-933.wav",
    );
    expect(play).toHaveBeenCalledTimes(3);
    expect(pause).toHaveBeenCalledTimes(1);
    expect(audio.currentTime).toBe(0);

    vi.unstubAllGlobals();
  });

  it("defaults to repeat and supports a one-ring preference", () => {
    const getItem = vi
      .fn()
      .mockReturnValueOnce(null)
      .mockReturnValueOnce("ONCE");
    vi.stubGlobal("window", { localStorage: { getItem } });

    expect(getOrderSoundMode()).toBe("REPEAT");
    expect(getOrderSoundMode()).toBe("ONCE");

    vi.unstubAllGlobals();
  });

  it("unlocks on the first gesture even before restaurant scope is available", () => {
    const eventTarget = new EventTarget();
    const unlockSound = vi.fn();
    const cleanup = registerOrderSoundUnlockListeners({
      eventTarget,
      soundEnabled: () => true,
      unlockSound,
    });

    eventTarget.dispatchEvent(new Event("pointerdown"));
    eventTarget.dispatchEvent(new Event("keydown"));

    expect(unlockSound).toHaveBeenCalledTimes(1);
    cleanup();
  });
});
