"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/hooks/useAuth";
import { formatMoney, resolveCurrency } from "@/lib/currency";
import { getAdminGlobalSettings } from "@/services/global-settings";

export const currencyQueryKeys = {
  globalSettings: ["admin-global-settings"] as const,
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

export const useCurrency = (restaurantId?: string | null) => {
  void restaurantId;

  const globalSettingsQuery = useGlobalSettingsCurrency();

  const defaultCurrency = globalSettingsQuery.data?.defaultCurrency;
  const currency = resolveCurrency(defaultCurrency);

  return useMemo(
    () => ({
      currency,
      defaultCurrency,
      restaurantCurrency: undefined,
      formatMoney: (
        amount?: number | string | null,
        currencyOverride?: string | null,
        options?: Intl.NumberFormatOptions
      ) => {
        void currencyOverride;

        return formatMoney(amount, defaultCurrency, options);
      },
      resolveCurrency: (...candidates: Array<string | null | undefined>) => {
        void candidates;

        return resolveCurrency(defaultCurrency);
      },
      isLoading: globalSettingsQuery.isLoading,
    }),
    [
      currency,
      defaultCurrency,
      globalSettingsQuery.isLoading,
    ]
  );
};
