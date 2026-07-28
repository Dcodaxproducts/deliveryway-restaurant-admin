import { api } from "@/lib/axios";
import { isRecord } from "@/lib/auth";

/**
 * ==============================
 * TYPES (ALIGNED WITH BACKEND)
 * ==============================
 */

export type NotificationChannel = {
  email: boolean;
  sms: boolean;
  whatsapp: boolean;
};

export type NotificationSettingsValues = {
  emailAddress: string | null;
  phoneNumber: string | null;
  whatsappNumber: string | null;
  notificationTypes: {
    [key: string]: NotificationChannel;
  };
};

/**
 * ==============================
 * HELPERS
 * ==============================
 */
const normalizeNotificationSettings = (
  payload: unknown,
): NotificationSettingsValues => {
  const settings = isRecord(payload) ? payload : {};
  const notificationTypes = isRecord(settings.notificationTypes)
    ? Object.fromEntries(
        Object.entries(settings.notificationTypes).map(([key, value]) => {
          const channel = isRecord(value) ? value : {};
          return [
            key,
            {
              email: channel.email === true,
              sms: channel.sms === true,
              whatsapp: channel.whatsapp === true,
            },
          ];
        }),
      )
    : {};

  return {
    emailAddress:
      typeof settings.emailAddress === "string" ? settings.emailAddress : "",
    phoneNumber:
      typeof settings.phoneNumber === "string" ? settings.phoneNumber : "",
    whatsappNumber:
      typeof settings.whatsappNumber === "string"
        ? settings.whatsappNumber
        : "",
    notificationTypes,
  };
};

/**
 * ==============================
 * API ENDPOINTS
 * ==============================
 */

const getBaseUrl = (restaurantId: string) =>
  `/restaurants/${encodeURIComponent(restaurantId)}/notification-settings`;

/**
 * GET GLOBAL NOTIFICATION SETTINGS
 */
export const getNotificationSettings = async (
  restaurantId: string,
): Promise<NotificationSettingsValues> => {
  const { data } = await api.get(getBaseUrl(restaurantId));
  const response = isRecord(data) ? data : {};

  return normalizeNotificationSettings(response.data);
};

/**
 */
export const updateNotificationSettings = async (
  restaurantId: string,
  payload: NotificationSettingsValues,
) => {
  const cleanPayload = normalizeNotificationSettings(payload);

  const { data } = await api.patch(getBaseUrl(restaurantId), cleanPayload);

  return data;
};
