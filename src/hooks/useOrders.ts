"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { getOrderById, getOrders } from "@/services/orders/orders.api";

interface UseOrdersParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  orderType?: string;
  sortOrder?: string;
  kind?: string;
  restaurantId?: string;
  branchId?: string;
  enabled?: boolean;
}

export interface Order {
  id: string;
  orderNumber?: string;
  orderType: string;
  status: string;
  totalAmount?: number;
  createdAt: string;
  branchId?: string | null;
  branch?: { id?: string; name?: string } | null;
  customer?: { fullName?: string; name?: string } | null;
}

interface OrdersMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export default function useOrders(params?: UseOrdersParams) {
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
