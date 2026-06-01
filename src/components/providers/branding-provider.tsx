"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useTheme } from "next-themes";

import { useAuthContext } from "@/components/providers/auth-provider";
import { DEFAULT_RESTAURANT_BRANDING_PAYLOAD } from "@/config/default-branding";
import { isBranchAdminRole } from "@/lib/auth";
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
  savedBranding: RestaurantBrandingPayload;
  restaurant: RestaurantBrandingProfile;
  updateBrandingDraft: (nextPayload: RestaurantBrandingPayload) => void;
  saveBranding: (nextPayload: RestaurantBrandingPayload) => Promise<RestaurantBrandingPayload>;
  resetBranding: () => Promise<RestaurantBrandingPayload>;
  reloadBranding: () => Promise<RestaurantBrandingPayload>;
  isBrandingReady: boolean;
  isBrandingLoading: boolean;
  isBrandingSaving: boolean;
  brandingError?: string | null;
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
  const brandingReadSource = isBranchAdminRole(user?.role) ? "customer-home" : "restaurant";
  const requestIdRef = useRef(0);
  const [branding, setBranding] = useState<RestaurantBrandingPayload>(defaultBranding);
  const [savedBranding, setSavedBranding] = useState<RestaurantBrandingPayload>(defaultBranding);
  const [isBrandingReady, setIsBrandingReady] = useState(false);
  const [isBrandingLoading, setIsBrandingLoading] = useState(false);
  const [isBrandingSaving, setIsBrandingSaving] = useState(false);
  const [brandingError, setBrandingError] = useState<string | null>(null);

  const reloadBranding = useCallback(async () => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setBrandingError(null);

    if (!restaurantId) {
      setIsBrandingLoading(false);
      setIsBrandingReady(true);
      setBranding(defaultBranding);
      setSavedBranding(defaultBranding);
      return defaultBranding;
    }

    setIsBrandingLoading(true);
    setIsBrandingReady(false);

    try {
      const nextBranding = await getBrandingSettings(restaurantId, { source: brandingReadSource });

      if (requestIdRef.current === requestId) {
        setBranding(nextBranding);
        setSavedBranding(nextBranding);
        setBrandingError(null);
      }

      return nextBranding;
    } catch (error) {
      const errorMessage = getApiErrorMessage(error, "Unable to load branding settings.");

      if (requestIdRef.current === requestId) {
        setBranding(defaultBranding);
        setSavedBranding(defaultBranding);
        setBrandingError(errorMessage);
      }

      return defaultBranding;
    } finally {
      if (requestIdRef.current === requestId) {
        setIsBrandingLoading(false);
        setIsBrandingReady(true);
      }
    }
  }, [brandingReadSource, restaurantId]);

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
      requestIdRef.current += 1;
      setIsBrandingSaving(true);
      setBrandingError(null);

      try {
        const savedPayload = await saveBrandingSettings(nextPayload, restaurantId);
        setBranding(savedPayload);
        setSavedBranding(savedPayload);
        return savedPayload;
      } catch (error) {
        setBrandingError(getApiErrorMessage(error, "Unable to save branding settings."));
        throw error;
      } finally {
        setIsBrandingSaving(false);
      }
    },
    [restaurantId]
  );

  const resetBranding = useCallback(async () => {
    requestIdRef.current += 1;
    setIsBrandingSaving(true);
    setBrandingError(null);

    try {
      const resetPayload = await resetBrandingSettings(restaurantId);
      setBranding(resetPayload);
      setSavedBranding(resetPayload);
      return resetPayload;
    } catch (error) {
      setBrandingError(getApiErrorMessage(error, "Unable to reset branding settings."));
      throw error;
    } finally {
      setIsBrandingSaving(false);
    }
  }, [restaurantId]);

  const contextValue = useMemo<BrandingContextValue>(
    () => ({
      branding,
      savedBranding,
      restaurant: branding.restaurant,
      updateBrandingDraft,
      saveBranding,
      resetBranding,
      reloadBranding,
      isBrandingReady,
      isBrandingLoading,
      isBrandingSaving,
      brandingError,
    }),
    [
      branding,
      savedBranding,
      updateBrandingDraft,
      saveBranding,
      resetBranding,
      reloadBranding,
      isBrandingReady,
      isBrandingLoading,
      isBrandingSaving,
      brandingError,
    ]
  );

  return <BrandingContext.Provider value={contextValue}>{children}</BrandingContext.Provider>;
}
