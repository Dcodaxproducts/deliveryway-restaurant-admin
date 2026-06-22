import { httpClient } from "@/lib/axios";

export type LegalBusinessAddress = {
  street: string;
  shopNumber: string;
  city: string;
  state: string;
  country: string;
};

export type LegalBusinessAddressPayload = Omit<
  LegalBusinessAddress,
  "shopNumber"
> & {
  shopNumber: string | null;
};

export type LegalProfile = {
  restaurantId: string;
  legalBusinessName: string;
  taxNumber: string;
  businessAddress: LegalBusinessAddress;
  contractText: string;
};

export type LegalProfilePayload = Omit<
  LegalProfile,
  "restaurantId" | "businessAddress"
> & {
  businessAddress: LegalBusinessAddressPayload;
};

const emptyAddress: LegalBusinessAddress = {
  street: "",
  shopNumber: "",
  city: "",
  state: "",
  country: "",
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const getRecord = (source: Record<string, unknown> | undefined, key: string) => {
  const value = source?.[key];
  return isRecord(value) ? value : undefined;
};

const getString = (source: Record<string, unknown> | undefined, key: string) => {
  const value = source?.[key];
  return typeof value === "string" ? value : "";
};

const normalizeBusinessAddress = (
  value: unknown
): LegalBusinessAddress => {
  const address = isRecord(value) ? value : {};

  return {
    street: getString(address, "street"),
    shopNumber: getString(address, "shopNumber"),
    city: getString(address, "city"),
    state: getString(address, "state"),
    country: getString(address, "country"),
  };
};

export const normalizeLegalProfileResponse = (
  response: unknown,
  fallbackRestaurantId = ""
): LegalProfile => {
  const root = isRecord(response) ? response : {};
  const data = getRecord(root, "data") ?? root;
  const profile = getRecord(data, "legalProfile") ?? {};

  return {
    restaurantId: getString(data, "restaurantId") || fallbackRestaurantId,
    legalBusinessName: getString(profile, "legalBusinessName"),
    taxNumber: getString(profile, "taxNumber"),
    businessAddress: normalizeBusinessAddress(profile.businessAddress),
    contractText: getString(profile, "contractText"),
  };
};

export const createEmptyLegalProfile = (
  restaurantId = ""
): LegalProfile => ({
  restaurantId,
  legalBusinessName: "",
  taxNumber: "",
  businessAddress: { ...emptyAddress },
  contractText: "",
});

export const getLegalProfile = async (restaurantId: string) => {
  const response = await httpClient.get<unknown>(
    `/restaurants/${encodeURIComponent(restaurantId)}/legal-profile`
  );

  return normalizeLegalProfileResponse(response, restaurantId);
};

export const updateLegalProfile = async (
  restaurantId: string,
  payload: LegalProfilePayload
) => {
  const response = await httpClient.patch<unknown, LegalProfilePayload>(
    `/restaurants/${encodeURIComponent(restaurantId)}/legal-profile`,
    payload
  );

  return normalizeLegalProfileResponse(response, restaurantId);
};
