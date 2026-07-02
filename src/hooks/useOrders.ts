"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { getApiErrorMessage } from "@/lib/errors";
import {
  failPaymentTransaction,
  getOrderById,
  getOrders,
  markPaymentTransactionPaid,
  type PaymentStatusUpdatePayload,
  refundPaymentTransaction,
  updatePaymentTransactionStatus,
  updateOrderStatus,
} from "@/services/orders/orders.api";
import type { OrderStatusUpdatePayload } from "@/types/orders";

interface UseOrdersParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  orderType?: string;
  sortBy?: string;
  sortOrder?: string;
  kind?: string;
  restaurantId?: string;
  branchId?: string;
  enabled?: boolean;
}

interface OrdersMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export function useOrders(params?: UseOrdersParams) {
  const { user, isBranchAdmin } = useAuth();

  const restaurantId = params?.restaurantId ?? user?.restaurantId;
  const branchId = params?.branchId ?? (isBranchAdmin ? user?.branchId ?? undefined : undefined);

  const query = useQuery({
    queryKey: [
      "orders",
      restaurantId,
      branchId,
      params?.page,
      params?.limit,
      params?.search,
      params?.status,
      params?.orderType,
      params?.sortBy,
      params?.sortOrder,
      params?.kind,
    ],
    queryFn: () =>
      getOrders({
        restaurantId: restaurantId as string,
        page: params?.page,
        limit: params?.limit,
        search: params?.search,
        status: params?.status,
        orderType: params?.orderType,
        sortBy: params?.sortBy,
        sortOrder: params?.sortOrder,
        kind: params?.kind,
        branchId,
      }),
    enabled: !!restaurantId && (params?.enabled ?? true),
  });

  return {
    orders: query.data?.data || [],
    meta: (query.data?.meta as OrdersMeta | null) || null,
    loading: query.isLoading,
    refetch: query.refetch,
    error: query.error,
    isFetching: query.isFetching,
  };
}
export const useGetOrderById = (id?: string) => {
  return useQuery({
    queryKey: ["orders", "detail", id],
    queryFn: () => getOrderById(id as string),
    enabled: Boolean(id),
  });
};

export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      orderId,
      payload,
    }: {
      orderId: string;
      payload: OrderStatusUpdatePayload;
    }) => updateOrderStatus(orderId, payload),
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["orders", "detail", order.id] });
      toast.success("Order status updated");
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Unable to update order status"));
    },
  });
};

export const useSendOrderOutForDelivery = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId }: { orderId: string }) => {
      await updateOrderStatus(orderId, { status: "PREPARING" });
      return updateOrderStatus(orderId, { status: "OUT_FOR_DELIVERY" });
    },
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["orders", "detail", order.id] });
      toast.success("Order sent out for delivery");
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Unable to send order out for delivery"));
    },
  });
};

export const useSendOrderWithExternalDriver = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId }: { orderId: string }) => {
      return updateOrderStatus(orderId, {
        status: "OUT_FOR_DELIVERY",
        deliveryFulfillmentMode: "EXTERNAL",
      });
    },
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["orders", "detail", order.id] });
      toast.success("Order sent with external driver");
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Unable to send order with external driver"));
    },
  });
};

export const useRefundPaymentTransaction = (orderId?: string | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      paymentId,
      amount,
      note,
    }: {
      paymentId: string;
      amount?: number;
      note?: string;
    }) => refundPaymentTransaction(paymentId, { amount, note }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      if (orderId) {
        queryClient.invalidateQueries({ queryKey: ["orders", "detail", orderId] });
      }
      toast.success("Payment refunded");
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Unable to refund payment"));
    },
  });
};

export const useUpdatePaymentTransactionStatus = (orderId?: string | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      paymentId,
      status,
      note,
    }: {
      paymentId: string;
      status: PaymentStatusUpdatePayload["status"];
      note?: string;
    }) => {
      if (status === "PAID") {
        return markPaymentTransactionPaid(paymentId, { note });
      }

      if (status === "FAILED") {
        return failPaymentTransaction(paymentId, { note });
      }

      return updatePaymentTransactionStatus(paymentId, { status, note });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      if (orderId) {
        queryClient.invalidateQueries({ queryKey: ["orders", "detail", orderId] });
      }
      toast.success("Payment status updated");
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Unable to update payment status"));
    },
  });
};
