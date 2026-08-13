"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { io } from "socket.io-client";
import { toast } from "sonner";

import { useAuth } from "@/hooks/useAuth";
import { getStoredAuth } from "@/lib/auth";
import { API_BASE_URL } from "@/lib/constants";
import { claimPendingOrderNotifications } from "@/services/notifications";
import {
  printAcceptedOrderIfConfigured,
  printNewOrderIfConfigured,
} from "@/lib/accepted-order-printing";

type OrderCreatedPayload = {
  id: string;
  restaurantId: string;
  branchId: string;
  source?: "STOREFRONT" | "POS";
};

type OrderStatusUpdatedPayload = OrderCreatedPayload & {
  status: string;
};

export const ORDER_SOUND_STORAGE_KEY = "deliveryways.orderSound.enabled";
export const ORDER_SOUND_SETTING_EVENT = "deliveryways:order-sound-setting";
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

const MAX_SEEN_ORDER_IDS = 100;

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

let orderSoundAudioContext: AudioContext | null = null;

const getOrderSoundAudioContext = () => {
  if (orderSoundAudioContext && orderSoundAudioContext.state !== "closed") {
    return orderSoundAudioContext;
  }

  const AudioContextClass =
    window.AudioContext ??
    (
      window as typeof window & {
        webkitAudioContext?: typeof AudioContext;
      }
    ).webkitAudioContext;

  if (!AudioContextClass) return null;

  orderSoundAudioContext = new AudioContextClass();
  return orderSoundAudioContext;
};

export const unlockOrderNotificationSound = async () => {
  const context = getOrderSoundAudioContext();

  if (!context) return false;

  if (context.state === "suspended") {
    try {
      await context.resume();
    } catch {
      return false;
    }
  }

  return context.state === "running";
};

export const playNewOrderSound = async () => {
  const context = getOrderSoundAudioContext();

  if (!context || !(await unlockOrderNotificationSound())) return;

  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.frequency.setValueAtTime(880, context.currentTime);
  gain.gain.setValueAtTime(0.12, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.45);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.45);
};

export function useRealtimeOrderNotifications() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const orders = useTranslations("orders");
  const seenOrderIds = useRef(new Set<string>());
  const ringingOrders = useRef(new Map<string, number>());
  const { token, restaurantId, branchId, isBranchAdmin, isRestaurantAdmin } =
    useAuth();

  useEffect(() => {
    if (
      !token ||
      !restaurantId ||
      (!isRestaurantAdmin && !isBranchAdmin) ||
      (isBranchAdmin && !branchId)
    ) {
      return;
    }

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
      toast.dismiss(`new-order-${orderId}`);
    };
    const stopAllOrderAlerts = () => {
      [...ringingOrders.current.keys()].forEach(stopOrderAlert);
    };
    const startOrderAlert = (orderId: string) => {
      stopOrderAlert(orderId);
      if (!soundEnabled()) return;
      void playNewOrderSound();
      ringingOrders.current.set(
        orderId,
        window.setInterval(() => void playNewOrderSound(), 3_000),
      );
    };
    const handleSoundSetting = () => {
      if (!soundEnabled()) {
        stopAllOrderAlerts();
        return;
      }

      void unlockOrderNotificationSound();
    };
    const unlockSoundFromUserGesture = () => {
      window.removeEventListener("pointerdown", unlockSoundFromUserGesture);
      window.removeEventListener("keydown", unlockSoundFromUserGesture);
      if (soundEnabled()) {
        void unlockOrderNotificationSound();
      }
    };
    window.addEventListener(ORDER_SOUND_SETTING_EVENT, handleSoundSetting);
    const handleOrderAlertDismiss = (event: Event) => {
      const orderId = (event as CustomEvent<{ orderId?: string }>).detail
        ?.orderId;
      if (orderId) stopOrderAlert(orderId);
    };
    window.addEventListener(
      ORDER_ALERT_DISMISS_EVENT,
      handleOrderAlertDismiss,
    );
    window.addEventListener("pointerdown", unlockSoundFromUserGesture);
    window.addEventListener("keydown", unlockSoundFromUserGesture);

    const handleOrderCreated = (payload: OrderCreatedPayload) => {
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
          id: `new-order-${payload.id}`,
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
    };

    socket.on("connect", () => {
      refreshOrderData();
      void claimPendingOrderNotifications({
        restaurantId,
        channel: "IN_APP",
        ...(isBranchAdmin && branchId ? { branchId } : {}),
      })
        .then((response) => {
          response.data.forEach((notification) => {
            const order = notification.order;
            if (!order?.id) return;

            handleOrderCreated({
              id: order.id,
              restaurantId: order.restaurantId ?? restaurantId,
              branchId: order.branchId ?? branchId ?? "",
              source: "STOREFRONT",
            });
          });
        })
        .catch(() => {
          // Realtime delivery remains active if backlog claiming is unavailable.
        });
    });

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

    return () => {
      window.removeEventListener(ORDER_SOUND_SETTING_EVENT, handleSoundSetting);
      window.removeEventListener(
        ORDER_ALERT_DISMISS_EVENT,
        handleOrderAlertDismiss,
      );
      window.removeEventListener("pointerdown", unlockSoundFromUserGesture);
      window.removeEventListener("keydown", unlockSoundFromUserGesture);
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
