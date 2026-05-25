import api from "@/lib/axios";

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
  payload: any
): NotificationSettingsValues => {
  return {
    emailAddress: payload?.emailAddress ?? "",
    phoneNumber: payload?.phoneNumber ?? "",
    whatsappNumber: payload?.whatsappNumber ?? "",
    notificationTypes: payload?.notificationTypes ?? {},
  };
};

/**
 * ==============================
 * API ENDPOINTS
 * ==============================
 */

const BASE_URL = "/admin/global-settings";

/**
 * GET GLOBAL NOTIFICATION SETTINGS
 */
export const getNotificationSettings = async (): Promise<NotificationSettingsValues> => {
  const { data } = await api.get(BASE_URL);

  // backend wraps inside notificationSettings
  const settings = data?.data?.notificationSettings ?? data?.notificationSettings ?? {};

  return normalizeNotificationSettings(settings);
};

/**
 * UPDATE GLOBAL NOTIFICATION SETTINGS
 */
export const updateNotificationSettings = async (
  payload: NotificationSettingsValues
) => {
  const cleanPayload = normalizeNotificationSettings(payload);

  const { data } = await api.patch(BASE_URL, {
    notificationSettings: cleanPayload,
  });

  return data;
};