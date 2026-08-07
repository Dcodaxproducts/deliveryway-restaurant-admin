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

const getCustomerHomeEndpoint = () => "/customer-app/home";

export type CustomDomainStatus = {
  customDomain: string;
  verified: boolean;
  verifiedAt?: string | null;
  dns: {
    type: "CNAME";
    host: string;
    hostLabel: string;
    target: string;
  };
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const getCustomDomainStatus = async (
  restaurantId: string,
): Promise<CustomDomainStatus> => {
  const response = await httpClient.get<unknown>(
    `${getRestaurantEndpoint(restaurantId)}/custom-domain-status`,
  );
  const root = isRecord(response) ? response : {};
  const nestedData = isRecord(root.data) ? root.data : root;
  const data = isRecord(nestedData.data) ? nestedData.data : nestedData;
  const dns = isRecord(data.dns) ? data.dns : {};

  return {
    customDomain: String(data.customDomain ?? ""),
    verified: data.verified === true,
    verifiedAt:
      typeof data.verifiedAt === "string" ? data.verifiedAt : null,
    dns: {
      type: "CNAME",
      host: String(dns.host ?? data.customDomain ?? ""),
      hostLabel: String(dns.hostLabel ?? ""),
      target: String(dns.target ?? ""),
    },
  };
};

export type BrandingReadSource = "restaurant" | "customer-home";

type BrandingReadOptions = {
  source?: BrandingReadSource;
};

const getDefaultBrandingSettings = (): RestaurantBrandingPayload =>
  normalizeBrandingPayload(DEFAULT_RESTAURANT_BRANDING_PAYLOAD);

export const getBrandingSettings = async (
  restaurantId?: string | null,
  options?: BrandingReadOptions,
): Promise<RestaurantBrandingPayload> => {
  const normalizedRestaurantId = restaurantId?.trim();

  if (!normalizedRestaurantId) {
    return getDefaultBrandingSettings();
  }

  const response = options?.source === "customer-home"
    ? await httpClient.get<unknown>(getCustomerHomeEndpoint(), {
      params: { restaurantId: normalizedRestaurantId },
    })
    : await httpClient.get<unknown>(getRestaurantEndpoint(normalizedRestaurantId));

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

  const currentBrandingSettings = await getBrandingSettings(normalizedRestaurantId);
  const resetPayload = normalizeBrandingPayload({
    restaurant: {
      ...currentBrandingSettings.restaurant,
      branding: {
        ...defaults.restaurant.branding,
        ...(currentBrandingSettings.restaurant.branding.extra
          ? { extra: currentBrandingSettings.restaurant.branding.extra }
          : {}),
      },
    },
  });
  const response = await httpClient.patch<unknown, RestaurantBrandingPatchPayload>(
    getRestaurantEndpoint(normalizedRestaurantId),
    buildRestaurantBrandingPatchPayload(resetPayload),
  );

  return normalizeBrandingApiResponse(response);
};
