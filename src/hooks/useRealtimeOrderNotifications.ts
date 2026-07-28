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

type OrderCreatedPayload = {
  id: string;
  restaurantId: string;
  branchId: string;
};

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

const playNewOrderSound = () => {
  const AudioContextClass =
    window.AudioContext ??
    (
      window as typeof window & {
        webkitAudioContext?: typeof AudioContext;
      }
    ).webkitAudioContext;

  if (!AudioContextClass) return;

  const context = new AudioContextClass();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.frequency.setValueAtTime(880, context.currentTime);
  gain.gain.setValueAtTime(0.12, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.45);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.45);
  oscillator.addEventListener("ended", () => {
    void context.close();
  });
};

export function useRealtimeOrderNotifications() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const orders = useTranslations("orders");
  const seenOrderIds = useRef(new Set<string>());
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

    socket.on("connect", refreshOrderData);

    socket.on("order.created", (payload: OrderCreatedPayload) => {
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

      try {
        playNewOrderSound();
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
          description: orders("ordersUpdatedRealtime"),
          duration: Number.POSITIVE_INFINITY,
          action: {
            label: orders("viewOrderDetails"),
            onClick: () => router.push(`/orders/details/${payload.id}`),
          },
        },
      );
    });

    return () => {
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
