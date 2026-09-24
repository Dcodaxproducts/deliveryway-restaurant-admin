"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getRestaurantOrderingSettings,
  type RestaurantOrderingSettings,
  updateRestaurantOrderingSettings,
} from "@/services/ordering-settings";

export const restaurantOrderingSettingsQueryKey = (restaurantId?: string) =>
  ["restaurants", "ordering-settings", restaurantId ?? ""] as const;

export const useRestaurantOrderingSettings = (restaurantId?: string) =>
  useQuery({
    queryKey: restaurantOrderingSettingsQueryKey(restaurantId),
    queryFn: () => getRestaurantOrderingSettings(restaurantId as string),
    enabled: Boolean(restaurantId),
  });

type UpdateOrderingSettingsVariables = {
  restaurantId: string;
  settings: RestaurantOrderingSettings;
};

type UpdateOrderingSettingsContext = {
  previousSettings?: RestaurantOrderingSettings;
};

export const useUpdateRestaurantOrderingSettings = () => {
  const queryClient = useQueryClient();

  return useMutation<
    RestaurantOrderingSettings,
    Error,
    UpdateOrderingSettingsVariables,
    UpdateOrderingSettingsContext
  >({
    mutationFn: ({ restaurantId, settings }) =>
      updateRestaurantOrderingSettings(restaurantId, settings),
    onMutate: async ({ restaurantId, settings }) => {
      const queryKey = restaurantOrderingSettingsQueryKey(restaurantId);
      await queryClient.cancelQueries({ queryKey });
      const previousSettings =
        queryClient.getQueryData<RestaurantOrderingSettings>(queryKey);

      queryClient.setQueryData(queryKey, settings);

      return { previousSettings };
    },
    onError: (_error, { restaurantId }, context) => {
      if (context?.previousSettings) {
        queryClient.setQueryData(
          restaurantOrderingSettingsQueryKey(restaurantId),
          context.previousSettings,
        );
      }
    },
    onSuccess: (settings, { restaurantId }) => {
      queryClient.setQueryData(
        restaurantOrderingSettingsQueryKey(restaurantId),
        settings,
      );
    },
    onSettled: (_data, _error, { restaurantId }) =>
      queryClient.invalidateQueries({
        queryKey: restaurantOrderingSettingsQueryKey(restaurantId),
      }),
  });
};
