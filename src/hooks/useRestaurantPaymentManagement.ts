"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  createRestaurantPayoutRequest,
  getRestaurantPayoutRequests,
  getRestaurantPaymentManagement,
  getRestaurantWallet,
  type CreateRestaurantPayoutRequestPayload,
} from "@/services/restaurant-payment-management";

export const restaurantPaymentManagementKeys = {
  detail: (restaurantId?: string | null) =>
    ["restaurant-payment-management", restaurantId ?? ""] as const,
  wallet: (restaurantId?: string | null) =>
    ["restaurant-wallet", restaurantId ?? ""] as const,
  payoutRequests: (restaurantId?: string | null) =>
    ["restaurant-payout-requests", restaurantId ?? ""] as const,
};

export const useRestaurantPaymentManagement = (
  restaurantId?: string | null,
  enabled = true
) =>
  useQuery({
    queryKey: restaurantPaymentManagementKeys.detail(restaurantId),
    queryFn: () => getRestaurantPaymentManagement(restaurantId as string),
    enabled: Boolean(restaurantId) && enabled,
  });

export const useRestaurantWallet = (restaurantId?: string | null) =>
  useQuery({
    queryKey: restaurantPaymentManagementKeys.wallet(restaurantId),
    queryFn: () => getRestaurantWallet(restaurantId as string),
    enabled: Boolean(restaurantId),
  });

export const useRestaurantPayoutRequests = (restaurantId?: string | null) =>
  useQuery({
    queryKey: restaurantPaymentManagementKeys.payoutRequests(restaurantId),
    queryFn: () => getRestaurantPayoutRequests(restaurantId as string),
    enabled: Boolean(restaurantId),
  });

export const useCreateRestaurantPayoutRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      restaurantId,
      payload,
    }: {
      restaurantId: string;
      payload: CreateRestaurantPayoutRequestPayload;
    }) => createRestaurantPayoutRequest(restaurantId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: restaurantPaymentManagementKeys.wallet(variables.restaurantId),
      });
      queryClient.invalidateQueries({
        queryKey: restaurantPaymentManagementKeys.payoutRequests(variables.restaurantId),
      });
      toast.success("Payout request submitted");
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message ?? "Unable to submit payout request");
    },
  });
};
