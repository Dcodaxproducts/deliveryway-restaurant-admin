import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  AdjustCustomerLoyaltyParams,
  GetLoyaltyProgramParams,
  LoyaltyCustomerSummaryParams,
  UpdateLoyaltyProgramPayload,
  adjustCustomerLoyaltyPoints,
  getCustomerLoyaltySummary,
  getLoyaltyProgram,
  updateLoyaltyProgram,
} from "@/services/loyalty/loyalty.api";

/**
 * ==============================
 * QUERY KEYS
 * ==============================
 */

export const loyaltyKeys = {
  all: ["admin-loyalty"] as const,

  customer: (customerId?: string) =>
    ["admin-loyalty", "customer", customerId || ""] as const,

  program: (restaurantId?: string) =>
    ["admin-loyalty", "program", restaurantId || "global"] as const,
};

/**
 * ==============================
 * CUSTOMER LOYALTY HOOKS
 * ==============================
 */

export const useGetCustomerLoyaltySummary = (
  params?: LoyaltyCustomerSummaryParams
) => {
  return useQuery({
    queryKey: loyaltyKeys.customer(params?.customerId),
    queryFn: () =>
      getCustomerLoyaltySummary(params as LoyaltyCustomerSummaryParams),
    enabled: Boolean(params?.customerId),
  });
};

export const useAdjustCustomerLoyaltyPoints = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: AdjustCustomerLoyaltyParams) =>
      adjustCustomerLoyaltyPoints(params),

    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: loyaltyKeys.customer(variables.customerId),
      });

      queryClient.invalidateQueries({
        queryKey: loyaltyKeys.all,
      });

      toast.success(
        variables.payload.isCredit
          ? "Loyalty points added successfully"
          : "Loyalty points deducted successfully"
      );
    },

    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Failed to adjust loyalty points"
      );
    },
  });
};

/**
 * ==============================
 * LOYALTY PROGRAM HOOKS
 * ==============================
 */

export const useGetLoyaltyProgram = (params?: GetLoyaltyProgramParams) => {
  return useQuery({
    queryKey: loyaltyKeys.program(params?.restaurantId),
    queryFn: () => getLoyaltyProgram(params),
  });
};

export const useUpdateLoyaltyProgram = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateLoyaltyProgramPayload) =>
      updateLoyaltyProgram(payload),

    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: loyaltyKeys.program(variables.restaurantId),
      });

      queryClient.invalidateQueries({
        queryKey: loyaltyKeys.all,
      });

      toast.success("Loyalty program updated successfully");
    },

    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Failed to update loyalty program"
      );
    },
  });
};