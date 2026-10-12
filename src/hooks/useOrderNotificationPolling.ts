"use client";

import { useCallback, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { useAuth } from "@/hooks/useAuth";
import { useVisibilityPolling } from "@/hooks/useVisibilityPolling";
import { isStaffRole } from "@/lib/auth";
import {
  printAcceptedOrderIfConfigured,
  printNewOrderIfConfigured,
} from "@/lib/accepted-order-printing";
import { getNewOrderToastId } from "@/hooks/realtime-order-state";
import {
  updateOrderDiscoverySnapshot,
  updateOrderStatusSnapshot,
} from "@/lib/order-discovery";
import { claimPendingOrderNotifications } from "@/services/notifications";
import { getOrders } from "@/services/orders/orders.api";

const ORDER_POLL_INTERVAL_MS = 15_000;
const ORDER_DISCOVERY_LIMIT = 100;
const ORDER_SOUND_REPEAT_INTERVAL_MS = 3_000;
const ORDER_SOUND_URL = "/sounds/mixkit-bell-notification-933.wav";

export const ORDER_SOUND_STORAGE_KEY = "deliveryways.orderSound.enabled";
export const ORDER_SOUND_MODE_STORAGE_KEY = "deliveryways.orderSound.mode";
export const ORDER_SOUND_SETTING_EVENT = "deliveryways:order-sound-setting";
export const ORDER_ALERT_DISMISS_EVENT = "deliveryways:order-alert-dismiss";
export type OrderSoundMode = "ONCE" | "REPEAT";

let orderSoundAudio: HTMLAudioElement | null = null;

const getOrderSoundAudio = () => {
  if (!orderSoundAudio) {
    orderSoundAudio = new Audio(ORDER_SOUND_URL);
    orderSoundAudio.preload = "auto";
  }
  return orderSoundAudio;
};

export const getOrderSoundMode = (): OrderSoundMode =>
  window.localStorage.getItem(ORDER_SOUND_MODE_STORAGE_KEY) === "ONCE"
    ? "ONCE"
    : "REPEAT";

export const silenceOrderAlert = (orderId: string) => {
  if (typeof window === "undefined" || !orderId.trim()) return;

  window.dispatchEvent(
    new CustomEvent(ORDER_ALERT_DISMISS_EVENT, { detail: { orderId } }),
  );
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

const playNewOrderSound = async () => {
  const audio = getOrderSoundAudio();
  audio.currentTime = 0;
  try {
    await audio.play();
  } catch {
    // Browsers can block media until the first user gesture.
  }
};

export function useOrderNotificationPolling() {
  const queryClient = useQueryClient();
  const orders = useTranslations("orders");
  const seenOrderIds = useRef(new Set<string>());
  const processedPendingOrderIds = useRef(new Set<string>());
  const knownStatuses = useRef(new Map<string, string>());
  const ringingOrders = useRef(new Map<string, number>());
  const initialized = useRef(false);
  const {
    user,
    token,
    tenantId,
    restaurantId,
    branchId,
    isBranchAdmin,
    isRestaurantAdmin,
  } = useAuth();
  const isStaff = isStaffRole(user?.role, user?.actorType);

  useEffect(() => {
    seenOrderIds.current.clear();
    processedPendingOrderIds.current.clear();
    knownStatuses.current.clear();
    initialized.current = false;
  }, [branchId, restaurantId]);

  useEffect(() => {
    const soundEnabled = () =>
      window.localStorage.getItem(ORDER_SOUND_STORAGE_KEY) !== "false";
    const unlockFromUserGesture = () => {
      window.removeEventListener("pointerdown", unlockFromUserGesture);
      window.removeEventListener("keydown", unlockFromUserGesture);
      if (soundEnabled()) void unlockOrderNotificationSound();
    };
    const unlockFromSettingChange = () => {
      if (soundEnabled()) void unlockOrderNotificationSound();
    };

    window.addEventListener("pointerdown", unlockFromUserGesture);
    window.addEventListener("keydown", unlockFromUserGesture);
    window.addEventListener(ORDER_SOUND_SETTING_EVENT, unlockFromSettingChange);

    return () => {
      window.removeEventListener("pointerdown", unlockFromUserGesture);
      window.removeEventListener("keydown", unlockFromUserGesture);
      window.removeEventListener(
        ORDER_SOUND_SETTING_EVENT,
        unlockFromSettingChange,
      );
    };
  }, []);

  useEffect(() => {
    const stopOrderAlert = (orderId: string) => {
      const interval = ringingOrders.current.get(orderId);
      if (interval !== undefined) window.clearInterval(interval);
      ringingOrders.current.delete(orderId);
      toast.dismiss(getNewOrderToastId(orderId));
    };
    const stopAllOrderAlerts = () => {
      [...ringingOrders.current.keys()].forEach(stopOrderAlert);
    };
    const handleSettingChange = () => {
      if (window.localStorage.getItem(ORDER_SOUND_STORAGE_KEY) === "false") {
        stopAllOrderAlerts();
      }
    };
    const handleDismiss = (event: Event) => {
      const orderId = (event as CustomEvent<{ orderId?: string }>).detail
        ?.orderId;
      if (orderId) stopOrderAlert(orderId);
    };

    window.addEventListener(ORDER_SOUND_SETTING_EVENT, handleSettingChange);
    window.addEventListener(ORDER_ALERT_DISMISS_EVENT, handleDismiss);
    return () => {
      window.removeEventListener(ORDER_SOUND_SETTING_EVENT, handleSettingChange);
      window.removeEventListener(ORDER_ALERT_DISMISS_EVENT, handleDismiss);
      stopAllOrderAlerts();
    };
  }, []);

  const enabled = Boolean(
    token &&
      tenantId &&
      restaurantId &&
      (isRestaurantAdmin || isBranchAdmin || isStaff) &&
      (!(isBranchAdmin || isStaff) || branchId),
  );

  const startOrderAlert = useCallback(
    (orderId: string, orderLabel: string) => {
      const existingInterval = ringingOrders.current.get(orderId);
      if (existingInterval !== undefined) window.clearInterval(existingInterval);
      ringingOrders.current.delete(orderId);

      const soundEnabled =
        window.localStorage.getItem(ORDER_SOUND_STORAGE_KEY) !== "false";
      if (soundEnabled) {
        void playNewOrderSound();
        if (getOrderSoundMode() === "REPEAT") {
          ringingOrders.current.set(
            orderId,
            window.setInterval(
              () => void playNewOrderSound(),
              ORDER_SOUND_REPEAT_INTERVAL_MS,
            ),
          );
        }
      }

      toast.success(orders("newOrderReceived", { order: orderLabel }), {
        id: getNewOrderToastId(orderId),
        description: orders("ordersUpdatedAutomatically"),
        duration: Number.POSITIVE_INFINITY,
        action: {
          label: orders("viewOrderDetails"),
          onClick: () => {
            silenceOrderAlert(orderId);
            window.location.assign(`/orders/details/${orderId}`);
          },
        },
      });
    },
    [orders],
  );

  const poll = useCallback(async () => {
    if (!restaurantId) return;

    const scopeBranchId = isBranchAdmin || isStaff ? branchId : undefined;
    const [response, pendingNotifications] = await Promise.all([
      getOrders({
        restaurantId,
        branchId: scopeBranchId,
        page: 1,
        limit: ORDER_DISCOVERY_LIMIT,
        sortBy: "createdAt",
        sortOrder: "desc",
      }),
      claimPendingOrderNotifications({
        channel: "IN_APP",
        restaurantId,
        ...(scopeBranchId ? { branchId: scopeBranchId } : {}),
      }),
    ]);

    for (const notification of pendingNotifications.data) {
      const order = notification.order;
      if (!order?.id || processedPendingOrderIds.current.has(order.id)) {
        continue;
      }

      processedPendingOrderIds.current.add(order.id);
      if (!seenOrderIds.current.has(order.id)) {
        seenOrderIds.current.add(order.id);
        startOrderAlert(order.id, order.id.slice(-8));
      }
      void printNewOrderIfConfigured({
        orderId: order.id,
        restaurantId: order.restaurantId ?? restaurantId,
        branchId: order.branchId ?? scopeBranchId,
      }).catch(() => toast.error(orders("newOrderAutoPrintFailed")));
    }

    const newOrders = updateOrderDiscoverySnapshot(
      response.data,
      seenOrderIds.current,
      initialized.current,
    );
    const statusChanges = updateOrderStatusSnapshot(
      response.data,
      knownStatuses.current,
      initialized.current,
    );

    for (const order of newOrders) {
      startOrderAlert(order.id, order.orderNumber || order.id.slice(-8));
    }

    for (const order of statusChanges) {
      if (order.status === "CONFIRMED") {
        void printAcceptedOrderIfConfigured({
          orderId: order.id,
          restaurantId,
          branchId: order.branchId ?? scopeBranchId,
        }).catch(() => toast.error(orders("acceptedOrderAutoPrintFailed")));
      }
      if (!["PAYMENT_PENDING", "PLACED"].includes(order.status)) {
        silenceOrderAlert(order.id);
      }
    }

    initialized.current = true;
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["orders"] }),
      queryClient.invalidateQueries({ queryKey: ["notifications"] }),
    ]);
  }, [
    branchId,
    isBranchAdmin,
    isStaff,
    orders,
    queryClient,
    restaurantId,
    startOrderAlert,
  ]);

  useVisibilityPolling({
    enabled,
    intervalMs: ORDER_POLL_INTERVAL_MS,
    poll,
  });
}
