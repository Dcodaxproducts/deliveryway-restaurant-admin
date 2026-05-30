import { DEFAULT_RESTAURANT_BRANDING_PAYLOAD } from "@/config/default-branding";
import { httpClient } from "@/lib/axios";
import {
  buildRestaurantBrandingPatchPayload,
  normalizeBrandingApiResponse,
  normalizeBrandingPayload,
} from "@/lib/branding";
import type { RestaurantBrandingPayload, RestaurantBrandingPatchPayload } from "@/types/branding";

const getRestaurantEndpoint = (restaurantId: string) =>
  `/restaurants/${encodeURIComponent(restaurantId)}`;

const getDefaultBrandingSettings = (): RestaurantBrandingPayload =>
  normalizeBrandingPayload(DEFAULT_RESTAURANT_BRANDING_PAYLOAD);

export const getBrandingSettings = async (restaurantId?: string | null): Promise<RestaurantBrandingPayload> => {
  const normalizedRestaurantId = restaurantId?.trim();

  if (!normalizedRestaurantId) {
    return getDefaultBrandingSettings();
  }

  const response = await httpClient.get<unknown>(getRestaurantEndpoint(normalizedRestaurantId));
  return normalizeBrandingApiResponse(response);
};

export const saveBrandingSettings = async (
  payload: RestaurantBrandingPayload,
  restaurantId?: string | null,
): Promise<RestaurantBrandingPayload> => {
  const normalizedRestaurantId = restaurantId?.trim();

  if (!normalizedRestaurantId) {
    return normalizeBrandingPayload(payload);
  }

  const response = await httpClient.patch<unknown, RestaurantBrandingPatchPayload>(
    getRestaurantEndpoint(normalizedRestaurantId),
    buildRestaurantBrandingPatchPayload(payload),
  );

  return normalizeBrandingApiResponse(response);
};

export const resetBrandingSettings = async (restaurantId?: string | null): Promise<RestaurantBrandingPayload> => {
  const defaults = getDefaultBrandingSettings();
  const normalizedRestaurantId = restaurantId?.trim();

  if (!normalizedRestaurantId) {
    return defaults;
  }

  const response = await httpClient.patch<unknown, RestaurantBrandingPatchPayload>(
    getRestaurantEndpoint(normalizedRestaurantId),
    buildRestaurantBrandingPatchPayload(defaults),
  );

  return normalizeBrandingApiResponse(response);
};
