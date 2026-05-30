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
import { toast } from "sonner";

import { useAuthContext } from "@/components/providers/auth-provider";
import { DEFAULT_RESTAURANT_BRANDING_PAYLOAD } from "@/config/default-branding";
import { applyBrandingCssVariables, normalizeBrandingPayload } from "@/lib/branding";
import { getApiErrorMessage } from "@/lib/errors";
import {
  getBrandingSettings,
  resetBrandingSettings,
  saveBrandingSettings,
} from "@/services/branding";
import type { RestaurantBrandingPayload, RestaurantBrandingProfile } from "@/types/branding";

export type BrandingContextValue = {
  branding: RestaurantBrandingPayload;
  restaurant: RestaurantBrandingProfile;
  updateBrandingDraft: (nextPayload: RestaurantBrandingPayload) => void;
  saveBranding: (nextPayload: RestaurantBrandingPayload) => Promise<RestaurantBrandingPayload>;
  resetBranding: () => Promise<RestaurantBrandingPayload>;
  reloadBranding: () => Promise<RestaurantBrandingPayload>;
  isBrandingReady: boolean;
};

export const BrandingContext = createContext<BrandingContextValue | null>(null);

type BrandingProviderProps = {
  children: ReactNode;
};

const defaultBranding = normalizeBrandingPayload(DEFAULT_RESTAURANT_BRANDING_PAYLOAD);

export function BrandingProvider({ children }: BrandingProviderProps) {
  const { user } = useAuthContext();
  const { setTheme } = useTheme();
  const restaurantId = user?.restaurantId?.trim() || null;
  const [branding, setBranding] = useState<RestaurantBrandingPayload>(defaultBranding);
  const [isBrandingReady, setIsBrandingReady] = useState(false);

  const reloadBranding = useCallback(async () => {
    setIsBrandingReady(false);

    try {
      const nextBranding = await getBrandingSettings(restaurantId);
      setBranding(nextBranding);
      return nextBranding;
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to load branding settings."));
      setBranding(defaultBranding);
      return defaultBranding;
    } finally {
      setIsBrandingReady(true);
    }
  }, [restaurantId]);

  useEffect(() => {
    void reloadBranding();
  }, [reloadBranding]);

  useEffect(() => {
    applyBrandingCssVariables(branding);
    setTheme(branding.restaurant.branding.theme.mode);
  }, [branding, setTheme]);

  const updateBrandingDraft = useCallback((nextPayload: RestaurantBrandingPayload) => {
    setBranding(nextPayload);
  }, []);

  const saveBranding = useCallback(
    async (nextPayload: RestaurantBrandingPayload) => {
      const savedPayload = await saveBrandingSettings(nextPayload, restaurantId);
      setBranding(savedPayload);
      return savedPayload;
    },
    [restaurantId]
  );

  const resetBranding = useCallback(async () => {
    const resetPayload = await resetBrandingSettings(restaurantId);
    setBranding(resetPayload);
    return resetPayload;
  }, [restaurantId]);

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
