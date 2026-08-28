"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { io } from "socket.io-client";
import { toast } from "sonner";

import { useAuth } from "@/hooks/useAuth";
import { getStoredAuth } from "@/lib/auth";
import { buildLoginRoute } from "@/lib/auth-routes";
import { refreshStoredAccessToken } from "@/lib/axios";
import { API_BASE_URL } from "@/lib/constants";
import {
  getNewOrderToastId,
  shouldDismissNewOrderToast,
} from "@/hooks/realtime-order-state";
import { claimPendingOrderNotifications } from "@/services/notifications";
import {
  printAcceptedOrderIfConfigured,
  printNewOrderIfConfigured,
} from "@/lib/accepted-order-printing";
import { buildAutoOpenOrderPath } from "@/lib/new-order-navigation";

type OrderCreatedPayload = {
  id: string;
  restaurantId: string;
  branchId: string;
  source?: "STOREFRONT" | "POS";
};

type OrderStatusUpdatedPayload = OrderCreatedPayload & {
  status: string;
};

type HandleOrderCreatedOptions = {
  autoOpen?: boolean;
};

export const ORDER_SOUND_STORAGE_KEY = "deliveryways.orderSound.enabled";
export const ORDER_SOUND_MODE_STORAGE_KEY = "deliveryways.orderSound.mode";
export const ORDER_SOUND_SETTING_EVENT = "deliveryways:order-sound-setting";
export type OrderSoundMode = "ONCE" | "REPEAT";
export const getOrderSoundMode = (): OrderSoundMode =>
  window.localStorage.getItem(ORDER_SOUND_MODE_STORAGE_KEY) === "ONCE"
    ? "ONCE"
    : "REPEAT";
export const ORDER_ALERT_DISMISS_EVENT = "deliveryways:order-alert-dismiss";
export const silenceOrderAlert = (orderId: string) => {
  if (typeof window === "undefined" || !orderId.trim()) return;

  window.dispatchEvent(
    new CustomEvent(ORDER_ALERT_DISMISS_EVENT, { detail: { orderId } }),
  );
};
export const isPendingOrderAlertStatus = (status?: string | null) =>
  ["PAYMENT_PENDING", "PLACED"].includes(
    String(status || "")
      .trim()
      .toUpperCase(),
  );

export const isScopedOrderStatusUpdate = ({
  payload,
  restaurantId,
  branchId,
  isBranchAdmin,
}: {
  payload: OrderStatusUpdatedPayload;
  restaurantId: string;
  branchId?: string | null;
  isBranchAdmin: boolean;
}) =>
  Boolean(payload?.id) &&
  payload.restaurantId === restaurantId &&
  (!isBranchAdmin || payload.branchId === branchId);

type OrderUpdatedPayload = OrderCreatedPayload & {
  status: string;
  paymentStatus: string;
};

const MAX_SEEN_ORDER_IDS = 100;
const ORDER_SOUND_REPEAT_INTERVAL_MS = 3_000;
export const PENDING_ORDER_RECOVERY_INTERVAL_MS = 15_000;

type OrderTrackingError = {
  code?: string;
  message?: string;
};

export const shouldRecoverOrderTrackingSocket = (reason: string) =>
  reason === "io server disconnect";

export const isOrderTrackingAuthenticationError = (
  error?: OrderTrackingError | Error,
) => {
  const code = error && "code" in error ? String(error.code ?? "") : "";
  const message = String(error?.message ?? "").toLowerCase();

  return (
    code.toUpperCase() === "UNAUTHORIZED" ||
    message.includes("unauthorized") ||
    message.includes("authentication") ||
    message.includes("invalid token") ||
    message.includes("expired token")
  );
};

export const shouldPollPendingOrderNotifications = ({
  socketConnected,
  visibilityState,
}: {
  socketConnected: boolean;
  visibilityState: DocumentVisibilityState;
}) => !socketConnected && visibilityState === "visible";

export const createOrderTrackingSocketRecovery = ({
  refreshAccessToken,
  reconnect,
  isActive,
  onAuthenticationFailure,
}: {
  refreshAccessToken: () => Promise<string | null>;
  reconnect: () => void;
  isActive: () => boolean;
  onAuthenticationFailure: () => void;
}) => {
  let recoveryPromise: Promise<boolean> | null = null;

  return () => {
    if (recoveryPromise) return recoveryPromise;

    recoveryPromise = (async () => {
      const accessToken = await refreshAccessToken();
      if (!isActive()) return false;

      if (!accessToken) {
        onAuthenticationFailure();
        return false;
      }

      reconnect();
      return true;
    })().finally(() => {
      recoveryPromise = null;
    });

    return recoveryPromise;
  };
};

export const startRepeatingOrderSound = ({
  orderId,
  intervals,
  enabled,
  repeat,
  playSound,
  schedule,
  clear,
}: {
  orderId: string;
  intervals: Map<string, number>;
  enabled: boolean;
  repeat: boolean;
  playSound: () => void;
  schedule: (callback: () => void, delayMs: number) => number;
  clear: (intervalId: number) => void;
}) => {
  const existingInterval = intervals.get(orderId);
  if (existingInterval !== undefined) clear(existingInterval);
  intervals.delete(orderId);

  if (!enabled) return;

  playSound();
  if (!repeat) return;

  intervals.set(orderId, schedule(playSound, ORDER_SOUND_REPEAT_INTERVAL_MS));
};

export const getOrderTrackingSocketUrl = () =>
  new URL("/orders-tracking", API_BASE_URL).toString().replace(/\/$/, "");

export const buildOrderTrackingSocketAuth = ({
  token,
  restaurantId,
  branchId,
}: {
  token: string;
  restaurantId: string;
  branchId?: string;
}) => ({
  token,
  restaurantId,
  ...(branchId ? { branchId } : {}),
});

const ORDER_SOUND_URL = "/sounds/mixkit-bell-notification-933.wav";
let orderSoundAudio: HTMLAudioElement | null = null;

const getOrderSoundAudio = () => {
  if (!orderSoundAudio) {
    orderSoundAudio = new Audio(ORDER_SOUND_URL);
    orderSoundAudio.preload = "auto";
  }
  return orderSoundAudio;
};

export const unlockOrderNotificationSound = async () => {
  const audio = getOrderSoundAudio();
  audio.muted = true;
  try {
    await audio.play();
    audio.pause();
    audio.currentTime = 0;
    audio.muted = false;
    return true;
  } catch {
    audio.muted = false;
    return false;
  }
};

export const playNewOrderSound = async () => {
  const audio = getOrderSoundAudio();
  audio.currentTime = 0;
  try {
    await audio.play();
  } catch {
    // Browsers can block media until the first user gesture.
  }
};

export const registerOrderSoundUnlockListeners = ({
  eventTarget,
  soundEnabled,
  unlockSound,
}: {
  eventTarget: EventTarget;
  soundEnabled: () => boolean;
  unlockSound: () => void;
}) => {
  const unlockFromUserGesture = () => {
    eventTarget.removeEventListener("pointerdown", unlockFromUserGesture);
    eventTarget.removeEventListener("keydown", unlockFromUserGesture);
    if (soundEnabled()) unlockSound();
  };
  const unlockFromSettingChange = () => {
    if (soundEnabled()) unlockSound();
  };

  eventTarget.addEventListener("pointerdown", unlockFromUserGesture);
  eventTarget.addEventListener("keydown", unlockFromUserGesture);
  eventTarget.addEventListener(
    ORDER_SOUND_SETTING_EVENT,
    unlockFromSettingChange,
  );

  return () => {
    eventTarget.removeEventListener("pointerdown", unlockFromUserGesture);
    eventTarget.removeEventListener("keydown", unlockFromUserGesture);
    eventTarget.removeEventListener(
      ORDER_SOUND_SETTING_EVENT,
      unlockFromSettingChange,
    );
  };
};

export function useRealtimeOrderNotifications() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const orders = useTranslations("orders");
  const seenOrderIds = useRef(new Set<string>());
  const ringingOrders = useRef(new Map<string, number>());
  const { token, restaurantId, branchId, isBranchAdmin, isRestaurantAdmin } =
    useAuth();

  useEffect(
    () =>
      registerOrderSoundUnlockListeners({
        eventTarget: window,
        soundEnabled: () =>
          window.localStorage.getItem(ORDER_SOUND_STORAGE_KEY) !== "false",
        unlockSound: () => void unlockOrderNotificationSound(),
      }),
    [],
  );

  useEffect(() => {
    if (
      !token ||
      !restaurantId ||
      (!isRestaurantAdmin && !isBranchAdmin) ||
      (isBranchAdmin && !branchId)
    ) {
      return;
    }

    let active = true;
    const socket = io(getOrderTrackingSocketUrl(), {
      auth: (callback) => {
        callback(
          buildOrderTrackingSocketAuth({
            token: getStoredAuth()?.accessToken ?? token,
            restaurantId,
            branchId,
          }),
        );
      },
      transports: ["websocket", "polling"],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: Number.POSITIVE_INFINITY,
      reconnectionDelay: 1_000,
      reconnectionDelayMax: 30_000,
      randomizationFactor: 0.5,
      timeout: 10_000,
    });

    const refreshOrderData = () => {
      void queryClient.invalidateQueries({ queryKey: ["orders"] });
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    };
    const soundEnabled = () =>
      window.localStorage.getItem(ORDER_SOUND_STORAGE_KEY) !== "false";
    const stopOrderSound = (orderId: string) => {
      const interval = ringingOrders.current.get(orderId);
      if (interval !== undefined) window.clearInterval(interval);
      ringingOrders.current.delete(orderId);
    };
    const stopOrderAlert = (orderId: string) => {
      stopOrderSound(orderId);
      toast.dismiss(getNewOrderToastId(orderId));
    };
    const stopAllOrderAlerts = () => {
      [...ringingOrders.current.keys()].forEach(stopOrderAlert);
    };
    const startOrderAlert = (orderId: string) => {
      startRepeatingOrderSound({
        orderId,
        intervals: ringingOrders.current,
        enabled: soundEnabled(),
        repeat: getOrderSoundMode() === "REPEAT",
        playSound: () => void playNewOrderSound(),
        schedule: (callback, delayMs) => window.setInterval(callback, delayMs),
        clear: (intervalId) => window.clearInterval(intervalId),
      });
    };
    const handleSoundSetting = () => {
      if (!soundEnabled()) {
        stopAllOrderAlerts();
      }
    };
    window.addEventListener(ORDER_SOUND_SETTING_EVENT, handleSoundSetting);
    const handleOrderAlertDismiss = (event: Event) => {
      const orderId = (event as CustomEvent<{ orderId?: string }>).detail
        ?.orderId;
      if (orderId) stopOrderAlert(orderId);
    };
    window.addEventListener(ORDER_ALERT_DISMISS_EVENT, handleOrderAlertDismiss);

    const handleOrderCreated = (
      payload: OrderCreatedPayload,
      options: HandleOrderCreatedOptions = {},
    ) => {
      if (
        !payload?.id ||
        payload.restaurantId !== restaurantId ||
        (isBranchAdmin && payload.branchId !== branchId) ||
        seenOrderIds.current.has(payload.id)
      ) {
        return;
      }

      seenOrderIds.current.add(payload.id);
      if (seenOrderIds.current.size > MAX_SEEN_ORDER_IDS) {
        const oldestOrderId = seenOrderIds.current.values().next().value;
        if (oldestOrderId) {
          seenOrderIds.current.delete(oldestOrderId);
        }
      }

      refreshOrderData();

      if (payload.source === "POS") {
        return;
      }

      void printNewOrderIfConfigured({
        orderId: payload.id,
        restaurantId,
        branchId: payload.branchId,
      }).catch(() => {
        toast.error(orders("newOrderAutoPrintFailed"));
      });

      try {
        startOrderAlert(payload.id);
      } catch {
        // Audio alerts are best-effort and can be blocked by browser policy.
      }

      if (
        typeof Notification !== "undefined" &&
        Notification.permission === "granted"
      ) {
        const desktopNotification = new Notification(
          orders("newOrderReceived", {
            order: payload.id.slice(-8),
          }),
          {
            body: orders("ordersUpdatedRealtime"),
            tag: `order-${payload.id}`,
          },
        );
        desktopNotification.onclick = () => {
          stopOrderAlert(payload.id);
          window.focus();
          router.push(`/orders/details/${payload.id}`);
          desktopNotification.close();
        };
      }

      toast.success(
        orders("newOrderReceived", {
          order: payload.id.slice(-8),
        }),
        {
          id: getNewOrderToastId(payload.id),
          description: orders("ordersUpdatedRealtime"),
          duration: Number.POSITIVE_INFINITY,
          action: {
            label: orders("viewOrderDetails"),
            onClick: () => {
              stopOrderAlert(payload.id);
              router.push(`/orders/details/${payload.id}`);
            },
          },
          onDismiss: () => stopOrderSound(payload.id),
        },
      );

      if (options.autoOpen !== false) {
        router.push(buildAutoOpenOrderPath(payload.id));
      }
    };

    let pendingOrderRecoveryPromise: Promise<void> | null = null;
    const recoverPendingOrders = () => {
      if (!active) return Promise.resolve();
      if (pendingOrderRecoveryPromise) return pendingOrderRecoveryPromise;

      pendingOrderRecoveryPromise = claimPendingOrderNotifications({
        restaurantId,
        channel: "IN_APP",
        ...(isBranchAdmin && branchId ? { branchId } : {}),
      })
        .then((response) => {
          if (!active) return;

          response.data.forEach((notification) => {
            const order = notification.order;
            if (!order?.id) return;

            handleOrderCreated(
              {
                id: order.id,
                restaurantId: order.restaurantId ?? restaurantId,
                branchId: order.branchId ?? branchId ?? "",
                source: "STOREFRONT",
              },
              { autoOpen: false },
            );
          });
        })
        .catch(() => {
          // The next bounded recovery attempt can retry transient HTTP failures.
        })
        .finally(() => {
          pendingOrderRecoveryPromise = null;
        });

      return pendingOrderRecoveryPromise;
    };

    const recoverSocketAuthentication = createOrderTrackingSocketRecovery({
      refreshAccessToken: refreshStoredAccessToken,
      reconnect: () => {
        socket.disconnect();
        socket.connect();
      },
      isActive: () => active,
      onAuthenticationFailure: () => {
        const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
        window.location.href = buildLoginRoute(currentPath);
      },
    });

    socket.on("connect", () => {
      refreshOrderData();
      void recoverPendingOrders();
    });

    socket.on("order.tracking.error", (error: OrderTrackingError) => {
      if (isOrderTrackingAuthenticationError(error)) {
        void recoverSocketAuthentication();
      }
    });

    socket.on("connect_error", (error: Error) => {
      if (isOrderTrackingAuthenticationError(error)) {
        void recoverSocketAuthentication();
      }
    });

    socket.on("disconnect", (reason) => {
      if (!active) return;

      void recoverPendingOrders();
      if (shouldRecoverOrderTrackingSocket(reason)) {
        void recoverSocketAuthentication();
      }
    });

    const recoverWhileDisconnected = () => {
      if (
        shouldPollPendingOrderNotifications({
          socketConnected: socket.connected,
          visibilityState: document.visibilityState,
        })
      ) {
        void recoverPendingOrders();
      }
    };
    const pendingOrderRecoveryInterval = window.setInterval(
      recoverWhileDisconnected,
      PENDING_ORDER_RECOVERY_INTERVAL_MS,
    );
    document.addEventListener("visibilitychange", recoverWhileDisconnected);

    socket.on("order.created", handleOrderCreated);

    socket.on("order.status.updated", (payload: OrderStatusUpdatedPayload) => {
      if (
        !isScopedOrderStatusUpdate({
          payload,
          restaurantId,
          branchId,
          isBranchAdmin,
        })
      ) {
        return;
      }

      refreshOrderData();
      void queryClient.invalidateQueries({
        queryKey: ["orders", "detail", payload.id],
      });

      if (!isPendingOrderAlertStatus(payload.status)) {
        stopOrderAlert(payload.id);
      }

      if (payload.status === "CONFIRMED") {
        void printAcceptedOrderIfConfigured({
          orderId: payload.id,
          restaurantId,
          branchId: payload.branchId,
        }).catch(() => {
          toast.error(orders("acceptedOrderAutoPrintFailed"));
        });
      }
    });

    socket.on("order.updated", (payload: OrderUpdatedPayload) => {
      if (
        !payload?.id ||
        payload.restaurantId !== restaurantId ||
        (isBranchAdmin && payload.branchId !== branchId)
      ) {
        return;
      }

      void queryClient.invalidateQueries({ queryKey: ["orders"] });
      void queryClient.invalidateQueries({
        queryKey: ["orders", "detail", payload.id],
      });
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });

      if (shouldDismissNewOrderToast(payload.status)) {
        toast.dismiss(getNewOrderToastId(payload.id));
      }
    });

    return () => {
      active = false;
      window.removeEventListener(ORDER_SOUND_SETTING_EVENT, handleSoundSetting);
      window.removeEventListener(
        ORDER_ALERT_DISMISS_EVENT,
        handleOrderAlertDismiss,
      );
      document.removeEventListener(
        "visibilitychange",
        recoverWhileDisconnected,
      );
      window.clearInterval(pendingOrderRecoveryInterval);
      stopAllOrderAlerts();
      socket.disconnect();
    };
  }, [
    branchId,
    isBranchAdmin,
    isRestaurantAdmin,
    orders,
    queryClient,
    restaurantId,
    router,
    token,
  ]);
}
