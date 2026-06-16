import api, { httpClient } from "@/lib/axios";

export type RestaurantOption = {
  id: string;
  name?: string;
  slug?: string | null;
  domain?: string | null;
  tenantId?: string | null;
};

export type RestaurantSettings = Record<string, unknown>;

export type RestaurantDetail = RestaurantOption & {
  settings: RestaurantSettings;
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const getRecord = (
  source: Record<string, unknown> | undefined,
  key: string
) => {
  const value = source?.[key];
  return isRecord(value) ? value : undefined;
};

const unwrapRestaurantResponse = (response: unknown) => {
  if (!isRecord(response)) return {};

  const data = response.data;
  return isRecord(data) ? data : response;
};

const getBoolean = (
  source: Record<string, unknown> | undefined,
  key: string
) => {
  const value = source?.[key];
  return typeof value === "boolean" ? value : undefined;
};

export const normalizeRestaurantDetail = (
  response: unknown,
  fallbackId = ""
): RestaurantDetail => {
  const data = unwrapRestaurantResponse(response);
  const settings = getRecord(data, "settings") ?? {};

  return {
    id: typeof data.id === "string" ? data.id : fallbackId,
    name: typeof data.name === "string" ? data.name : undefined,
    slug: typeof data.slug === "string" ? data.slug : null,
    domain: typeof data.domain === "string" ? data.domain : null,
    tenantId: typeof data.tenantId === "string" ? data.tenantId : null,
    settings,
  };
};

export const getGiftCardsVisibilityFromSettings = (
  settings: RestaurantSettings | undefined
) => {
  const customerApp = getRecord(settings, "customerApp");
  const customerAppGiftCards = getRecord(customerApp, "giftCards");
  const rootGiftCards = getRecord(settings, "giftCards");

  return (
    getBoolean(customerAppGiftCards, "isEnabled") ??
    getBoolean(rootGiftCards, "isEnabled") ??
    getBoolean(customerApp, "giftCardsEnabled") ??
    getBoolean(settings, "giftCardsEnabled") ??
    false
  );
};

export const mergeGiftCardsVisibilitySettings = (
  settings: RestaurantSettings | undefined,
  isEnabled: boolean
): RestaurantSettings => {
  const currentSettings = isRecord(settings) ? settings : {};
  const currentCustomerApp = getRecord(currentSettings, "customerApp") ?? {};
  const currentGiftCards = getRecord(currentCustomerApp, "giftCards") ?? {};

  return {
    ...currentSettings,
    customerApp: {
      ...currentCustomerApp,
      giftCards: {
        ...currentGiftCards,
        isEnabled,
      },
    },
  };
};

export const getRestaurants = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
}) => {
  const { data } = await api.get("/restaurants", { params });
  return data;
};

export const getRestaurant = async (restaurantId: string) => {
  const response = await httpClient.get<unknown>(`/restaurants/${restaurantId}`);

  return normalizeRestaurantDetail(response, restaurantId);
};

export const updateRestaurantGiftCardsVisibility = async (
  restaurantId: string,
  isEnabled: boolean
) => {
  const restaurant = await getRestaurant(restaurantId);
  const settings = mergeGiftCardsVisibilitySettings(restaurant.settings, isEnabled);
  const response = await httpClient.patch<unknown, { settings: RestaurantSettings }>(
    `/restaurants/${restaurantId}`,
    { settings }
  );

  return normalizeRestaurantDetail(response, restaurantId);
};
