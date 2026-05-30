"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useTheme } from "next-themes";

import { useAuthContext } from "@/components/providers/auth-provider";
import { applyBrandingCssVariables } from "@/lib/branding";
import {
  getBrandingSettings,
  resetBrandingSettings,
  saveBrandingSettings,
} from "@/services/branding";
import type { RestaurantBrandingPayload, RestaurantBrandingProfile } from "@/types/branding";

const DEFAULT_RESTAURANT_STORAGE_KEY = "platform/default";

export type BrandingContextValue = {
  branding: RestaurantBrandingPayload;
  restaurant: RestaurantBrandingProfile;
  updateBrandingDraft: (nextPayload: RestaurantBrandingPayload) => void;
  saveBranding: (nextPayload: RestaurantBrandingPayload) => RestaurantBrandingPayload;
  resetBranding: () => void;
  reloadBranding: () => void;
  isBrandingReady: boolean;
};

export const BrandingContext = createContext<BrandingContextValue | null>(null);

type BrandingProviderProps = {
  children: ReactNode;
};

const getRestaurantStorageId = (restaurantId?: string | null): string =>
  restaurantId?.trim() || DEFAULT_RESTAURANT_STORAGE_KEY;

export function BrandingProvider({ children }: BrandingProviderProps) {
  const { user } = useAuthContext();
  const { setTheme } = useTheme();
  const restaurantStorageId = getRestaurantStorageId(user?.restaurantId);
  const [branding, setBranding] = useState<RestaurantBrandingPayload>(() =>
    getBrandingSettings(restaurantStorageId)
  );
  const [isBrandingReady, setIsBrandingReady] = useState(false);

  const reloadBranding = useCallback(() => {
    setBranding(getBrandingSettings(restaurantStorageId));
    setIsBrandingReady(true);
  }, [restaurantStorageId]);

  useEffect(() => {
    reloadBranding();
  }, [reloadBranding]);

  useEffect(() => {
    applyBrandingCssVariables(branding);
    setTheme(branding.restaurant.branding.theme.mode);
  }, [branding, setTheme]);

  const updateBrandingDraft = useCallback((nextPayload: RestaurantBrandingPayload) => {
    setBranding(nextPayload);
  }, []);

  const saveBranding = useCallback(
    (nextPayload: RestaurantBrandingPayload) => {
      const savedPayload = saveBrandingSettings(nextPayload, restaurantStorageId);
      setBranding(savedPayload);
      return savedPayload;
    },
    [restaurantStorageId]
  );

  const resetBranding = useCallback(() => {
    resetBrandingSettings(restaurantStorageId);
    reloadBranding();
  }, [reloadBranding, restaurantStorageId]);

  const contextValue = useMemo<BrandingContextValue>(
    () => ({
      branding,
      restaurant: branding.restaurant,
      updateBrandingDraft,
      saveBranding,
      resetBranding,
      reloadBranding,
      isBrandingReady,
    }),
    [
      branding,
      updateBrandingDraft,
      saveBranding,
      resetBranding,
      reloadBranding,
      isBrandingReady,
    ]
  );

  return <BrandingContext.Provider value={contextValue}>{children}</BrandingContext.Provider>;
}
