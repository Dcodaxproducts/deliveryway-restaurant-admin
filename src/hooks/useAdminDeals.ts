"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  createAdminDeal,
  deleteAdminDeal,
  getAdminDeal,
  getAdminDeals,
  getAdminDealStats,
  updateAdminDeal,
} from "@/services/admin-deals";
import { getApiErrorMessage } from "@/lib/errors";
import type {
  AdminDealCreatePayload,
  AdminDealsListParams,
  AdminDealUpdatePayload,
} from "@/types/admin-deals";

type AdminDealScopeParams = {
  restaurantId?: string;
  branchId?: string;
};

export const adminDealsQueryKeys = {
  all: ["admin-deals"] as const,
  list: (params?: AdminDealsListParams) =>
    [
      "admin-deals",
      "list",
      params?.restaurantId ?? "",
      params?.branchId ?? "",
      params?.page ?? 1,
      params?.limit ?? 20,
      params?.search ?? "",
      params?.lifecycle ?? "",
    ] as const,
  detail: (id: string | null, params?: AdminDealScopeParams) =>
    ["admin-deals", "detail", id, params] as const,
  stats: (id: string | null, params?: AdminDealScopeParams) =>
    ["admin-deals", "stats", id, params] as const,
};

export function useAdminDeals(params: AdminDealsListParams) {
  return useQuery({
    queryKey: adminDealsQueryKeys.list(params),
    queryFn: () => getAdminDeals(params),
    placeholderData: (previousData) => previousData,
  });
}

export function useAdminDeal(id: string | null, params?: AdminDealScopeParams) {
  return useQuery({
    queryKey: adminDealsQueryKeys.detail(id, params),
    queryFn: () => getAdminDeal(id as string, params),
    enabled: Boolean(id),
  });
}

export function useAdminDealStats(id: string | null, params?: AdminDealScopeParams) {
  return useQuery({
    queryKey: adminDealsQueryKeys.stats(id, params),
    queryFn: () => getAdminDealStats(id as string, params),
    enabled: Boolean(id),
  });
}

export function useCreateAdminDeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AdminDealCreatePayload) => createAdminDeal(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminDealsQueryKeys.all });
      toast.success("Deal created successfully.");
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Unable to create deal."));
    },
  });
}

export function useUpdateAdminDeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
      params,
    }: {
      id: string;
      payload: AdminDealUpdatePayload;
      params?: AdminDealScopeParams;
    }) => updateAdminDeal(id, payload, params),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: adminDealsQueryKeys.all });
      queryClient.invalidateQueries({
        queryKey: adminDealsQueryKeys.detail(variables.id, variables.params),
      });
      toast.success("Deal updated successfully.");
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Unable to update deal."));
    },
  });
}

export function useDeleteAdminDeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, params }: { id: string; params?: AdminDealScopeParams }) =>
      deleteAdminDeal(id, params),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: adminDealsQueryKeys.all });
      queryClient.invalidateQueries({
        queryKey: adminDealsQueryKeys.detail(variables.id, variables.params),
      });
      queryClient.invalidateQueries({
        queryKey: adminDealsQueryKeys.stats(variables.id, variables.params),
      });
      toast.success("Deal deleted successfully.");
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Unable to delete deal."));
    },
  });
}
