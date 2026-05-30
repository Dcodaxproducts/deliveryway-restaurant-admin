import type { RestaurantBrandingPayload } from "@/types/branding";
import {
  buildBrandingApiPayload,
  clearLocalBranding,
  readLocalBranding,
  writeLocalBranding,
} from "@/lib/branding";

export const getBrandingSettings = (restaurantId?: string | null): RestaurantBrandingPayload => {
  // Backend API integration point: future GET belongs here.
  // When endpoints are ready, replace readLocalBranding with a GET like:
  // GET `/v1/restaurants/:restaurantId/branding` or whatever backend finalizes later,
  // then pass the unknown response through normalizeBrandingApiResponse before returning.
  return readLocalBranding(restaurantId);
};

export const saveBrandingSettings = (
  payload: RestaurantBrandingPayload,
  restaurantId?: string | null,
): RestaurantBrandingPayload => {
  // Backend API integration point: future PUT/PATCH belongs here.
  // When endpoints are ready, replace writeLocalBranding with a PUT/PATCH equivalent for
  // `/v1/restaurants/:restaurantId/branding` or whatever backend finalizes later,
  // and send buildBrandingApiPayload(payload).
  return writeLocalBranding(buildBrandingApiPayload(payload), restaurantId);
};

export const resetBrandingSettings = (restaurantId?: string | null): void => {
  clearLocalBranding(restaurantId);
};
