"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { io } from "socket.io-client";
import { toast } from "sonner";

import { useAuth } from "@/hooks/useAuth";
import { getStoredAuth } from "@/lib/auth";
import { API_BASE_URL } from "@/lib/constants";
import { printAcceptedOrderIfConfigured } from "@/lib/accepted-order-printing";

type OrderCreatedPayload = {
  id: string;
  restaurantId: string;
  branchId: string;
};

type OrderStatusUpdatedPayload = OrderCreatedPayload & {
  status: string;
};

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

export function useRealtimeOrderNotifications() {
  const queryClient = useQueryClient();
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
        callback({ token: getStoredAuth()?.accessToken ?? token });
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

      void queryClient.invalidateQueries({ queryKey: ["orders"] });
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });

      toast.success(
        orders("newOrderReceived", {
          order: payload.id.slice(-8),
        }),
        { description: orders("ordersUpdatedRealtime") },
      );
    });

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

      void queryClient.invalidateQueries({ queryKey: ["orders"] });
      void queryClient.invalidateQueries({
        queryKey: ["orders", "detail", payload.id],
      });

      if (payload.status === "CONFIRMED") {
        void printAcceptedOrderIfConfigured({
          orderId: payload.id,
          restaurantId,
          branchId: payload.branchId,
        }).catch(() => {
          toast.error("Order accepted, but automatic printing failed.");
        });
      }
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
    token,
  ]);
}
