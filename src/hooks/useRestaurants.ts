import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { getApiErrorMessage } from "@/lib/errors";
import {
  getGiftCardsVisibilityFromSettings,
  getRestaurant,
  getRestaurants,
  updateRestaurantGiftCardsVisibility,
} from "@/services/restaurants";

export const restaurantQueryKeys = {
  all: ["restaurants"] as const,
  detail: (restaurantId?: string) => ["restaurants", "detail", restaurantId || ""] as const,
};

export const useGetRestaurants = (enabled = true) => {
  return useQuery({
    queryKey: restaurantQueryKeys.all,
    queryFn: () => getRestaurants(),
    enabled,
  });
};

export const useRestaurantGiftCardsVisibility = (restaurantId?: string) => {
  return useQuery({
    queryKey: restaurantQueryKeys.detail(restaurantId),
    queryFn: () => getRestaurant(restaurantId as string),
    enabled: Boolean(restaurantId),
    select: (restaurant) =>
      getGiftCardsVisibilityFromSettings(restaurant.settings),
  });
};

export const useUpdateRestaurantGiftCardsVisibility = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      restaurantId,
      isEnabled,
    }: {
      restaurantId: string;
      isEnabled: boolean;
    }) => updateRestaurantGiftCardsVisibility(restaurantId, isEnabled),
    onSuccess: (restaurant, variables) => {
      queryClient.setQueryData(
        restaurantQueryKeys.detail(variables.restaurantId),
        restaurant
      );
      queryClient.invalidateQueries({
        queryKey: restaurantQueryKeys.detail(variables.restaurantId),
      });
      toast.success(
        variables.isEnabled
          ? "Gift cards are visible on the customer website."
          : "Gift cards are hidden from the customer website."
      );
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(error, "Unable to update gift card visibility.")
      );
    },
  });
};
