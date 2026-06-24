import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  getRestaurantStripeAccount,
  updateRestaurantStripeAccount,
  type UpdateStripeAccountPayload,
} from "@/services/stripe-accounts";
import { restaurantPaymentManagementKeys } from "@/hooks/useRestaurantPaymentManagement";

export const stripeAccountKeys = {
  detail: (restaurantId?: string | null) =>
    ["stripe-account", restaurantId ?? ""] as const,
};

export const useRestaurantStripeAccount = (restaurantId?: string | null) =>
  useQuery({
    queryKey: stripeAccountKeys.detail(restaurantId),
    queryFn: () => getRestaurantStripeAccount(restaurantId as string),
    enabled: Boolean(restaurantId),
  });

export const useUpdateRestaurantStripeAccount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      restaurantId,
      payload,
    }: {
      restaurantId: string;
      payload: UpdateStripeAccountPayload;
    }) => updateRestaurantStripeAccount(restaurantId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: stripeAccountKeys.detail(variables.restaurantId),
      });
      queryClient.invalidateQueries({
        queryKey: restaurantPaymentManagementKeys.detail(variables.restaurantId),
      });
      toast.success("Stripe account settings saved");
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      toast.error(
        error.response?.data?.message ?? "Unable to save Stripe account settings"
      );
    },
  });
};
