"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  getRestaurantPaymentManagement,
  updateRestaurantPaymentMethods,
  type UpdateRestaurantPaymentMethodsPayload,
} from "@/services/restaurant-payment-management";

export const restaurantPaymentManagementKeys = {
  detail: (restaurantId?: string | null) =>
    ["restaurant-payment-management", restaurantId ?? ""] as const,
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

export const useUpdateRestaurantPaymentMethods = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      restaurantId,
      payload,
    }: {
      restaurantId: string;
      payload: UpdateRestaurantPaymentMethodsPayload;
    }) => updateRestaurantPaymentMethods(restaurantId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: restaurantPaymentManagementKeys.detail(variables.restaurantId),
      });
      toast.success("Restaurant payment methods saved");
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      toast.error(
        error.response?.data?.message ?? "Unable to save restaurant payment methods"
      );
    },
  });
};
