import { getLocalizedMessage } from "@/lib/localized-message";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  AdjustCustomerLoyaltyParams,
  AdjustCustomerWalletParams,
  GetLoyaltyProgramParams,
  LoyaltyCustomerSummaryParams,
  UpdateLoyaltyProgramPayload,
  adjustCustomerLoyaltyPoints,
  adjustCustomerWallet,
  getCustomerLoyaltySummary,
  getCustomerWalletSummary,
  getLoyaltyProgram,
  updateLoyaltyProgram,
} from "@/services/loyalty/loyalty.api";

type LoyaltyMutationMessages = {
  success?: string;
  creditSuccess?: string;
  debitSuccess?: string;
  error?: string;
};

type LoyaltyMutationOptions = {
  messages?: LoyaltyMutationMessages;
};

/**
 * ==============================
 * QUERY KEYS
 * ==============================
 */

export const loyaltyKeys = {
  all: ["admin-loyalty"] as const,

  customer: (customerId?: string) =>
    ["admin-loyalty", "customer", customerId || ""] as const,

  wallet: (customerId?: string) =>
    ["admin-loyalty", "wallet", customerId || ""] as const,

  program: (restaurantId?: string) =>
    ["admin-loyalty", "program", restaurantId || "global"] as const,
};

export const useGetCustomerWalletSummary = (
  params?: LoyaltyCustomerSummaryParams,
) => {
  return useQuery({
    queryKey: loyaltyKeys.wallet(params?.customerId),
    queryFn: () => getCustomerWalletSummary(params as LoyaltyCustomerSummaryParams),
    enabled: Boolean(params?.customerId),
  });
};

export const useAdjustCustomerWallet = (options?: LoyaltyMutationOptions) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: AdjustCustomerWalletParams) => adjustCustomerWallet(params),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: loyaltyKeys.wallet(variables.customerId) });
      queryClient.invalidateQueries({ queryKey: loyaltyKeys.all });
      toast.success(
        variables.payload.isCredit
          ? options?.messages?.creditSuccess || options?.messages?.success || getLocalizedMessage("notification145")
          : options?.messages?.debitSuccess || options?.messages?.success || getLocalizedMessage("notification146"),
      );
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || options?.messages?.error || getLocalizedMessage("notification015"),
      );
    },
  });
};

/**
 * ==============================
 * CUSTOMER LOYALTY HOOKS
 * ==============================
 */

export const useGetCustomerLoyaltySummary = (
  params?: LoyaltyCustomerSummaryParams,
) => {
  return useQuery({
    queryKey: loyaltyKeys.customer(params?.customerId),
    queryFn: () =>
      getCustomerLoyaltySummary(params as LoyaltyCustomerSummaryParams),
    enabled: Boolean(params?.customerId),
  });
};

export const useAdjustCustomerLoyaltyPoints = (
  options?: LoyaltyMutationOptions,
) => {
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
          ? options?.messages?.creditSuccess ||
              options?.messages?.success ||
              getLocalizedMessage("notification108")
          : options?.messages?.debitSuccess ||
              options?.messages?.success ||
              getLocalizedMessage("notification109"),
      );
    },

    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          options?.messages?.error ||
          getLocalizedMessage("notification014"),
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

export const useUpdateLoyaltyProgram = (options?: LoyaltyMutationOptions) => {
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

      toast.success(
        options?.messages?.success || getLocalizedMessage("notification110"),
      );
    },

    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          options?.messages?.error ||
          getLocalizedMessage("notification086"),
      );
    },
  });
};
