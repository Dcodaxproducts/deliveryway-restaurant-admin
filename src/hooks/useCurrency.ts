"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/hooks/useAuth";
import {
  formatMoney,
  getRestaurantSettingsCurrency,
  resolveCurrency,
} from "@/lib/currency";
import { getAdminGlobalSettings } from "@/services/global-settings";
import { getRestaurant } from "@/services/restaurants";

export const currencyQueryKeys = {
  globalSettings: ["admin-global-settings"] as const,
  restaurantSettings: (restaurantId?: string | null) =>
    ["restaurants", "currency-settings", restaurantId || ""] as const,
};

export const useGlobalSettingsCurrency = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: currencyQueryKeys.globalSettings,
    queryFn: getAdminGlobalSettings,
    enabled: Boolean(user),
    staleTime: 5 * 60 * 1000,
  });
};

export const useRestaurantSettingsCurrency = (restaurantId?: string | null) => {
  return useQuery({
    queryKey: currencyQueryKeys.restaurantSettings(restaurantId),
    queryFn: () => getRestaurant(restaurantId as string),
    enabled: Boolean(restaurantId),
    staleTime: 5 * 60 * 1000,
    select: (restaurant) => getRestaurantSettingsCurrency(restaurant.settings),
  });
};

export const useCurrency = (restaurantId?: string | null) => {
  const { restaurantId: authRestaurantId } = useAuth();
  const scopedRestaurantId = restaurantId ?? authRestaurantId ?? null;
  const globalSettingsQuery = useGlobalSettingsCurrency();
  const restaurantCurrencyQuery = useRestaurantSettingsCurrency(scopedRestaurantId);

  const defaultCurrency = globalSettingsQuery.data?.defaultCurrency;
  const restaurantCurrency = restaurantCurrencyQuery.data;
  const currency = resolveCurrency(restaurantCurrency, defaultCurrency);

  return useMemo(
    () => ({
      currency,
      defaultCurrency,
      restaurantCurrency,
      formatMoney: (
        amount?: number | string | null,
        currencyOverride?: string | null,
        options?: Intl.NumberFormatOptions
      ) =>
        formatMoney(
          amount,
          resolveCurrency(currencyOverride, restaurantCurrency, defaultCurrency),
          options
        ),
      resolveCurrency: (...candidates: Array<string | null | undefined>) =>
        resolveCurrency(...candidates, restaurantCurrency, defaultCurrency),
      isLoading:
        globalSettingsQuery.isLoading || restaurantCurrencyQuery.isLoading,
    }),
    [
      currency,
      defaultCurrency,
      globalSettingsQuery.isLoading,
      restaurantCurrency,
      restaurantCurrencyQuery.isLoading,
    ]
  );
};
