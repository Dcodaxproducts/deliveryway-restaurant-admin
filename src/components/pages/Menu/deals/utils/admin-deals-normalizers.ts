import type {
  AdminDeal,
  AdminDealCategorySummary,
  AdminDealCategoryRule,
  AdminDealSelectionMode,
  AdminDealVariationSummary,
  AdminDealMenuItemSummary,
  AdminDealsListParams,
  AdminDealsListResponse,
  AdminDealsMeta,
  AdminDealStats,
} from "@/types/admin-deals";

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

const getNullableDateString = (source: Record<string, unknown>, key: string) => {
  const value = getNullableString(source, key);
  if (!value) return null;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : value;
};

const getNestedNullableString = (
  source: Record<string, unknown>,
  key: string,
  nestedKey: string
) => {
  const nestedValue = source[key];
  if (!isRecord(nestedValue)) return null;

  return getNullableString(nestedValue, nestedKey);
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

const normalizeStringArray = (value: unknown) => {
  if (!Array.isArray(value)) return [];

  return value.filter((item): item is string => typeof item === "string");
};

const normalizeDealSelectionMode = (value: unknown): AdminDealSelectionMode => {
  return value === "FLEXIBLE_ITEMS" ? "FLEXIBLE_ITEMS" : "FIXED_ITEMS";
};

const normalizeScopeMenuItemIds = (
  value: unknown,
  scopeMenuItems?: AdminDealMenuItemSummary[]
) => {
  const explicitIds = normalizeStringArray(value);
  if (explicitIds.length > 0) return explicitIds;

  return scopeMenuItems?.map((item) => item.id).filter(Boolean) ?? [];
};

const normalizeScopeCategoryIds = (
  value: unknown,
  scopeCategories?: AdminDealCategorySummary[],
  scopeCategoryRules?: AdminDealCategoryRule[]
) => {
  const explicitIds = normalizeStringArray(value);
  if (explicitIds.length > 0) return explicitIds;

  const ruleIds =
    scopeCategoryRules
      ?.map((rule) => rule.menuCategoryId)
      .filter((id) => typeof id === "string" && id.length > 0) ?? [];
  if (ruleIds.length > 0) return ruleIds;

  return scopeCategories?.map((category) => category.id).filter(Boolean) ?? [];
};

export const getDefaultAdminDealsMeta = (
  params: AdminDealsListParams = {}
): AdminDealsMeta => ({
  page: params.page ?? 1,
  limit: params.limit ?? 20,
  total: 0,
  totalPages: 1,
  hasNext: false,
  hasPrevious: false,
});

export const normalizeAdminDealMenuItem = (
  value: unknown
): AdminDealMenuItemSummary | null => {
  if (!isRecord(value)) return null;

  const category = isRecord(value.category)
    ? {
        id: getOptionalString(value.category, "id"),
        name: getOptionalString(value.category, "name"),
      }
    : null;

  return {
    id: getString(value, "id"),
    name: getString(value, "name", "Unnamed item"),
    imageUrl: getNullableString(value, "imageUrl"),
    basePrice: typeof value.basePrice === "string" || typeof value.basePrice === "number" ? value.basePrice : null,
    discountedBasePrice:
      typeof value.discountedBasePrice === "string" || typeof value.discountedBasePrice === "number"
        ? value.discountedBasePrice
        : null,
    category,
  };
};

export const normalizeAdminDealCategory = (
  value: unknown
): AdminDealCategorySummary | null => {
  if (!isRecord(value)) return null;

  return {
    id: getString(value, "id"),
    name: getString(value, "name", "Unnamed category"),
    imageUrl: getNullableString(value, "imageUrl"),
    slug: getNullableString(value, "slug"),
  };
};

const normalizeAdminDealVariation = (
  value: unknown
): AdminDealVariationSummary | null => {
  if (!isRecord(value)) return null;

  return {
    id: getString(value, "id"),
    name: getString(value, "name", "Unnamed variation"),
  };
};

const normalizeAdminDealCategoryRule = (
  value: unknown
): AdminDealCategoryRule | null => {
  if (!isRecord(value)) return null;

  const menuCategoryId = getString(value, "menuCategoryId");
  if (!menuCategoryId) return null;

  const variation = normalizeAdminDealVariation(value.variation);

  return {
    menuCategoryId,
    itemLimit: getNumber(value, "itemLimit", 1),
    variationId: getNullableString(value, "variationId"),
    ...(variation ? { variation } : {}),
  };
};

export const normalizeAdminDeal = (value: unknown): AdminDeal | null => {
  if (!isRecord(value)) return null;

  const scopeMenuItems = Array.isArray(value.scopeMenuItems)
    ? value.scopeMenuItems
        .map((item) => normalizeAdminDealMenuItem(item))
        .filter((item): item is AdminDealMenuItemSummary => item !== null)
    : undefined;
  const scopeCategories = Array.isArray(value.scopeCategories)
    ? value.scopeCategories
        .map((category) => normalizeAdminDealCategory(category))
        .filter((category): category is AdminDealCategorySummary => category !== null)
    : undefined;
  const scopeCategoryRules = Array.isArray(value.scopeCategoryRules)
    ? value.scopeCategoryRules
        .map((rule) => normalizeAdminDealCategoryRule(rule))
        .filter((rule): rule is AdminDealCategoryRule => rule !== null)
    : undefined;

  return {
    id: getString(value, "id"),
    code: getNullableString(value, "code"),
    title: getString(value, "title", "Untitled deal"),
    description: getNullableString(value, "description"),
    thumbnailUrl: getNullableString(value, "thumbnailUrl"),
    imageUrl: getNullableString(value, "imageUrl"),
    restaurantId: getNullableString(value, "restaurantId") ?? getNestedNullableString(value, "restaurant", "id"),
    branchId: getNullableString(value, "branchId") ?? getNestedNullableString(value, "branch", "id"),
    discountValue: getNumber(value, "discountValue"),
    maxDiscountAmount: getNullableNumber(value, "maxDiscountAmount"),
    minOrderAmount: getNullableNumber(value, "minOrderAmount"),
    maxUses: getNullableNumber(value, "maxUses"),
    maxUsesPerCustomer: getNullableNumber(value, "maxUsesPerCustomer"),
    startsAt: getNullableDateString(value, "startsAt"),
    expiresAt: getNullableDateString(value, "expiresAt"),
    dealSelectionMode: normalizeDealSelectionMode(value.dealSelectionMode),
    dealRequiredQuantity: getNullableNumber(value, "dealRequiredQuantity"),
    scopeMenuItemIds: normalizeScopeMenuItemIds(value.scopeMenuItemIds, scopeMenuItems),
    scopeCategoryIds: normalizeScopeCategoryIds(
      value.scopeCategoryIds,
      scopeCategories,
      scopeCategoryRules
    ),
    ...(scopeMenuItems ? { scopeMenuItems } : {}),
    ...(scopeCategories ? { scopeCategories } : {}),
    ...(scopeCategoryRules ? { scopeCategoryRules } : {}),
    autoApply: getBoolean(value, "autoApply", true),
    isActive: getBoolean(value, "isActive"),
    lifecycle: getOptionalString(value, "lifecycle"),
    kind: getOptionalString(value, "kind"),
    discountType: getOptionalString(value, "discountType"),
    createdAt: getOptionalString(value, "createdAt"),
    updatedAt: getOptionalString(value, "updatedAt"),
    deletedAt: getNullableString(value, "deletedAt"),
  };
};

export const normalizeAdminDealsMeta = (
  value: unknown,
  params: AdminDealsListParams = {}
): AdminDealsMeta => {
  if (!isRecord(value)) return getDefaultAdminDealsMeta(params);

  return {
    page: getNumber(value, "page", params.page ?? 1),
    limit: getNumber(value, "limit", params.limit ?? 20),
    total: getNumber(value, "total"),
    totalPages: getNumber(value, "totalPages", 1),
    hasNext: getBoolean(value, "hasNext"),
    hasPrevious: getBoolean(value, "hasPrevious"),
  };
};

export const normalizeAdminDealsResponse = (
  payload: unknown,
  params: AdminDealsListParams = {}
): AdminDealsListResponse => {
  const source = isRecord(payload) ? payload : {};
  const nestedData = isRecord(source.data) ? source.data : {};
  const data = Array.isArray(source.data)
    ? source.data
    : Array.isArray(nestedData.data)
      ? nestedData.data
      : [];
  const deals = data
    .map((item) => normalizeAdminDeal(item))
    .filter((item): item is AdminDeal => item !== null);
  const message = typeof source.message === "string" ? source.message : undefined;

  return {
    deals,
    meta: normalizeAdminDealsMeta(source.meta ?? nestedData.meta, params),
    ...(message ? { message } : {}),
  };
};

export const unwrapAdminDeal = (payload: unknown): AdminDeal => {
  const data = isRecord(payload) && "data" in payload ? payload.data : payload;
  const source = Array.isArray(data) ? data[0] : data;
  const deal = normalizeAdminDeal(source);

  if (!deal) {
    throw new Error("Deal response is missing data.");
  }

  return deal;
};

export const normalizeAdminDealStats = (payload: unknown): AdminDealStats => {
  const source = isRecord(payload) && isRecord(payload.data) ? payload.data : payload;
  if (!isRecord(source)) return {};

  return { ...source };
};
