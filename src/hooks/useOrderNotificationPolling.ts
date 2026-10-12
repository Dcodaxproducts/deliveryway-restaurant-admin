"use client";

import { useCallback, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { useAuth } from "@/hooks/useAuth";
import { useVisibilityPolling } from "@/hooks/useVisibilityPolling";
import { updateOrderDiscoverySnapshot } from "@/lib/order-discovery";
import { getOrders } from "@/services/orders/orders.api";

const ORDER_POLL_INTERVAL_MS = 15_000;
const ORDER_DISCOVERY_LIMIT = 100;
export function useOrderNotificationPolling() {
  const queryClient = useQueryClient();
  const orders = useTranslations("orders");
  const seenOrderIds = useRef(new Set<string>());
  const initialized = useRef(false);
  const { token, restaurantId, branchId, isBranchAdmin, isRestaurantAdmin } =
    useAuth();

  useEffect(() => {
    seenOrderIds.current.clear();
    initialized.current = false;
  }, [branchId, restaurantId]);

  const enabled = Boolean(
    token &&
      restaurantId &&
      (isRestaurantAdmin || isBranchAdmin) &&
      (!isBranchAdmin || branchId),
  );

  const poll = useCallback(async () => {
    if (!restaurantId) return;

    const response = await getOrders({
      restaurantId,
      branchId: isBranchAdmin ? branchId : undefined,
      page: 1,
      limit: ORDER_DISCOVERY_LIMIT,
      sortBy: "createdAt",
      sortOrder: "desc",
    });
    const newOrders = updateOrderDiscoverySnapshot(
      response.data,
      seenOrderIds.current,
      initialized.current,
    );
    initialized.current = true;

    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["orders"] }),
      queryClient.invalidateQueries({ queryKey: ["notifications"] }),
    ]);

    for (const order of newOrders) {
      toast.success(
        orders("newOrderReceived", {
          order: order.orderNumber || order.id.slice(-8),
        }),
        { description: orders("ordersUpdatedAutomatically") },
      );
    }
  }, [branchId, isBranchAdmin, orders, queryClient, restaurantId]);

  useVisibilityPolling({
    enabled,
    intervalMs: ORDER_POLL_INTERVAL_MS,
    poll,
  });
}
