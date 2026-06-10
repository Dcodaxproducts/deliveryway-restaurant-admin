import api from "@/lib/axios";

export type CustomerAppContent = {
  restaurantId: string;
  privacyPolicy: string;
  title?: string;
  policyLink?: string;
};

type ApiRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is ApiRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const getRecord = (source: ApiRecord | undefined, key: string) => {
  const value = source?.[key];
  return isRecord(value) ? value : undefined;
};

const getString = (source: ApiRecord | undefined, key: string) => {
  const value = source?.[key];
  return typeof value === "string" ? value : undefined;
};

const unwrapResponseData = (response: unknown) => {
  if (!isRecord(response)) return undefined;
  const data = response.data;
  return isRecord(data) ? data : response;
};

export const getPrivacyPolicyContent = (response: unknown) => {
  const data = unwrapResponseData(response);
  const settings = getRecord(data, "settings");
  const customerApp = getRecord(settings, "customerApp") ?? getRecord(data, "customerApp");

  return (
    getString(data, "privacyPolicy") ??
    getString(data, "content") ??
    getString(customerApp, "privacyPolicy") ??
    ""
  );
};

export const normalizeCustomerAppContent = (
  response: unknown,
  fallbackRestaurantId = "",
): CustomerAppContent => {
  const data = unwrapResponseData(response);

  return {
    restaurantId: getString(data, "restaurantId") ?? fallbackRestaurantId,
    privacyPolicy: getPrivacyPolicyContent(response),
    title: getString(data, "title"),
    policyLink: getString(data, "policyLink"),
  };
};

export const buildPrivacyPolicyPageLink = () => "/privacy-policy";

export const getCustomerAppContent = async (restaurantId: string) => {
  const { data } = await api.get(`/restaurants/${restaurantId}/customer-app-content`);

  return normalizeCustomerAppContent(data, restaurantId);
};

export const updateCustomerAppPrivacyPolicy = async (
  restaurantId: string,
  privacyPolicy: string,
) => {
  const { data } = await api.patch(`/restaurants/${restaurantId}/customer-app-content`, {
    privacyPolicy,
  });

  return normalizeCustomerAppContent(data, restaurantId);
};

export const getPublicPrivacyPolicy = async (restaurantId: string) => {
  const { data } = await api.get("/public-content/privacy-policy", {
    params: { restaurantId },
  });

  return normalizeCustomerAppContent(data, restaurantId);
};
