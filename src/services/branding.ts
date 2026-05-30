import type { RestaurantBrandingPayload } from "@/types/branding";
import { clearLocalBranding, readLocalBranding, writeLocalBranding } from "@/lib/branding";

// Backend API integration point: replace these localStorage functions with HTTP calls when branding endpoints are ready.
export const getBrandingSettings = (restaurantId?: string | null): RestaurantBrandingPayload =>
  readLocalBranding(restaurantId);

export const saveBrandingSettings = (
  payload: RestaurantBrandingPayload,
  restaurantId?: string | null,
): RestaurantBrandingPayload => writeLocalBranding(payload, restaurantId);

export const resetBrandingSettings = (restaurantId?: string | null): void => {
  clearLocalBranding(restaurantId);
};
