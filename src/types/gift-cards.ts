export type GiftCardLifecycle = "active" | "scheduled" | "expired" | "inactive" | string;

export type GiftCardStatus = "ACTIVE" | "INACTIVE" | "EXPIRED" | "SCHEDULED" | string;

export type GiftCardRestaurant = {
  id: string;
  name: string;
};

export type GiftCardBranch = {
  id?: string;
  name?: string;
} | null;

export type GiftCard = {
  id: string;
  code: string;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  thumbnailUrl?: string | null;
  kind: "GIFT_CARD" | string;
  status?: GiftCardStatus;
  applyMode?: "ORDER_TOTAL" | string;
  autoApply?: boolean;
  discountType?: "FLAT" | string;
  discountValue: number;
  amount: number;
  maxUses?: number | null;
  maxUsesPerCustomer?: number | null;
  usedCount?: number;
  startsAt: string;
  expiresAt: string;
  isActive: boolean;
  branch?: GiftCardBranch;
  restaurant?: GiftCardRestaurant | null;
  createdAt?: string;
  updatedAt?: string;
};

export type GiftCardsMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
};

export type GiftCardsListParams = {
  page?: number;
  limit?: number;
  search?: string;
  restaurantId?: string;
  branchId?: string;
  lifecycle?: GiftCardLifecycle;
};

export type GiftCardsListResponse = {
  giftCards: GiftCard[];
  meta: GiftCardsMeta;
  message?: string;
};

export type GiftCardFormValues = {
  restaurantId?: string;
  branchId?: string;
  code?: string;
  title: string;
  description?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  amount: number;
  maxUses?: number | null;
  maxUsesPerCustomer?: number | null;
  startsAt: string;
  expiresAt: string;
  isActive: boolean;
};

export type GiftCardCreatePayload = {
  restaurantId?: string;
  branchId?: string;
  code?: string;
  title: string;
  description?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  amount: number;
  maxUses?: number;
  maxUsesPerCustomer?: number;
  startsAt: string;
  expiresAt: string;
  isActive: boolean;
};

export type GiftCardUpdatePayload = Partial<GiftCardCreatePayload>;

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const getString = (source: Record<string, unknown>, key: string, fallback = "") => {
  const value = source[key];
  return typeof value === "string" ? value : fallback;
};

const getOptionalString = (source: Record<string, unknown>, key: string) => {
  const value = source[key];
  return typeof value === "string" ? value : undefined;
};

const getNullableString = (source: Record<string, unknown>, key: string) => {
  const value = source[key];
  return typeof value === "string" ? value : null;
};

const getNumber = (source: Record<string, unknown>, key: string, fallback = 0) => {
  const value = source[key];
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }

  return fallback;
};

const getNullableNumber = (source: Record<string, unknown>, key: string) => {
  const value = source[key];
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }

  return null;
};

const getBoolean = (source: Record<string, unknown>, key: string, fallback = false) => {
  const value = source[key];
  return typeof value === "boolean" ? value : fallback;
};

const normalizeRestaurant = (value: unknown): GiftCardRestaurant | null => {
  if (!isRecord(value)) return null;

  const id = getString(value, "id");
  if (!id) return null;

  return {
    id,
    name: getString(value, "name", id),
  };
};

const normalizeBranch = (value: unknown): GiftCardBranch => {
  if (!isRecord(value)) return null;

  const id = getOptionalString(value, "id");
  const name = getOptionalString(value, "name");

  if (!id && !name) return null;

  return {
    ...(id ? { id } : {}),
    ...(name ? { name } : {}),
  };
};

export const getDefaultGiftCardsMeta = (
  params: GiftCardsListParams = {}
): GiftCardsMeta => ({
  page: params.page ?? 1,
  limit: params.limit ?? 20,
  total: 0,
  totalPages: 1,
  hasNext: false,
  hasPrevious: false,
});

export const normalizeGiftCardsMeta = (
  value: unknown,
  params: GiftCardsListParams = {}
): GiftCardsMeta => {
  if (!isRecord(value)) return getDefaultGiftCardsMeta(params);

  return {
    page: getNumber(value, "page", params.page ?? 1),
    limit: getNumber(value, "limit", params.limit ?? 20),
    total: getNumber(value, "total"),
    totalPages: getNumber(value, "totalPages", 1),
    hasNext: getBoolean(value, "hasNext") || getBoolean(value, "hasNextPage"),
    hasPrevious:
      getBoolean(value, "hasPrevious") || getBoolean(value, "hasPreviousPage"),
  };
};

export const normalizeGiftCard = (input: unknown): GiftCard | null => {
  if (!isRecord(input)) return null;

  const amount = getNumber(input, "amount", getNumber(input, "discountValue"));
  const discountValue = getNumber(input, "discountValue", amount);
  const restaurant = normalizeRestaurant(input.restaurant);
  const branch = normalizeBranch(input.branch);

  return {
    id: getString(input, "id"),
    code: getString(input, "code"),
    title: getString(input, "title", "Untitled gift card"),
    description: getNullableString(input, "description"),
    imageUrl: getNullableString(input, "imageUrl"),
    thumbnailUrl: getNullableString(input, "thumbnailUrl"),
    kind: getString(input, "kind", "GIFT_CARD"),
    status: getOptionalString(input, "status"),
    applyMode: getOptionalString(input, "applyMode"),
    autoApply: typeof input.autoApply === "boolean" ? input.autoApply : undefined,
    discountType: getOptionalString(input, "discountType"),
    discountValue,
    amount,
    maxUses: getNullableNumber(input, "maxUses"),
    maxUsesPerCustomer: getNullableNumber(input, "maxUsesPerCustomer"),
    usedCount: getNumber(input, "usedCount"),
    startsAt: getString(input, "startsAt"),
    expiresAt: getString(input, "expiresAt"),
    isActive: getBoolean(input, "isActive"),
    branch,
    restaurant,
    createdAt: getOptionalString(input, "createdAt"),
    updatedAt: getOptionalString(input, "updatedAt"),
  };
};

const getArrayPayload = (source: Record<string, unknown>) => {
  const data = source.data;
  if (Array.isArray(data)) return data;
  if (!isRecord(data)) return [];

  if (Array.isArray(data.giftCards)) return data.giftCards;
  if (Array.isArray(data.data)) return data.data;

  return [];
};

export const normalizeGiftCardsListResponse = (
  response: unknown,
  fallbackParams: GiftCardsListParams = {}
): GiftCardsListResponse => {
  const source = isRecord(response) ? response : {};
  const data = isRecord(source.data) ? source.data : {};
  const rawGiftCards = Array.isArray(source.giftCards)
    ? source.giftCards
    : getArrayPayload(source);
  const giftCards = rawGiftCards
    .map((item) => normalizeGiftCard(item))
    .filter((item): item is GiftCard => item !== null);
  const message = typeof source.message === "string" ? source.message : undefined;

  return {
    giftCards,
    meta: normalizeGiftCardsMeta(source.meta ?? data.meta, fallbackParams),
    ...(message ? { message } : {}),
  };
};

export const unwrapGiftCard = (response: unknown): GiftCard => {
  const source = isRecord(response) && "data" in response ? response.data : response;
  const giftCard = normalizeGiftCard(Array.isArray(source) ? source[0] : source);

  if (!giftCard) {
    throw new Error("Gift card response is missing data.");
  }

  return giftCard;
};
