import { httpClient } from "@/lib/axios";

export type RestaurantOrderingSettings = {
  preorderEnabled: boolean;
  tipsEnabled: boolean;
};

const DEFAULT_ORDERING_SETTINGS: RestaurantOrderingSettings = {
  preorderEnabled: true,
  tipsEnabled: true,
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const normalizeRestaurantOrderingSettings = (
  response: unknown,
): RestaurantOrderingSettings => {
  const responseRecord = isRecord(response) ? response : {};
  const data = isRecord(responseRecord.data)
    ? responseRecord.data
    : responseRecord;

  return {
    preorderEnabled:
      typeof data.preorderEnabled === "boolean"
        ? data.preorderEnabled
        : DEFAULT_ORDERING_SETTINGS.preorderEnabled,
    tipsEnabled:
      typeof data.tipsEnabled === "boolean"
        ? data.tipsEnabled
        : DEFAULT_ORDERING_SETTINGS.tipsEnabled,
  };
};

export const getRestaurantOrderingSettings = async (
  restaurantId: string,
): Promise<RestaurantOrderingSettings> => {
  const response = await httpClient.get<unknown>(
    "/restaurants/" + restaurantId + "/ordering-settings",
  );

  return normalizeRestaurantOrderingSettings(response);
};

export const updateRestaurantOrderingSettings = async (
  restaurantId: string,
  settings: RestaurantOrderingSettings,
): Promise<RestaurantOrderingSettings> => {
  const response = await httpClient.patch<unknown, RestaurantOrderingSettings>(
    "/restaurants/" + restaurantId + "/ordering-settings",
    settings,
  );

  return normalizeRestaurantOrderingSettings(response);
};
