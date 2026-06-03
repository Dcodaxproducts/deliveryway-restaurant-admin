import { httpClient } from "@/lib/axios";
import { cleanParams } from "@/lib/params";
import { extractResponseItems, extractResponseMeta } from "@/lib/response";
import type {
  ModifierCategoriesListResponse,
  ModifierCategoriesMeta,
  ModifierCategory,
  ModifierCategoryCreatePayload,
  ModifierCategoryListParams,
  ModifierCategoryUpdatePayload,
} from "@/types/modifier-categories";

const MODIFIER_CATEGORIES_ENDPOINT = "/menu/modifier-categories";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const getString = (record: Record<string, unknown>, key: string) => {
  const value = record[key];
  return typeof value === "string" ? value : "";
};

const getNullableString = (record: Record<string, unknown>, key: string) => {
  const value = record[key];
  return typeof value === "string" && value.trim() ? value : null;
};

const getOptionalString = (record: Record<string, unknown>, key: string) => {
  const value = record[key];
  return typeof value === "string" ? value : undefined;
};

const getOptionalNumber = (record: Record<string, unknown>, key: string) => {
  const value = record[key];

  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
};

const getOptionalBoolean = (record: Record<string, unknown>, key: string) => {
  const value = record[key];
  return typeof value === "boolean" ? value : undefined;
};

export const normalizeModifierCategory = (
  category: unknown
): ModifierCategory | null => {
  if (!isRecord(category)) return null;

  const id = getString(category, "id");
  const name = getString(category, "name");

  if (!id || !name) return null;

  return {
    id,
    restaurantId: getNullableString(category, "restaurantId"),
    name,
    slug: getString(category, "slug"),
    description: getNullableString(category, "description"),
    sortOrder: getOptionalNumber(category, "sortOrder"),
    isActive: getOptionalBoolean(category, "isActive"),
    createdAt: getOptionalString(category, "createdAt"),
    updatedAt: getOptionalString(category, "updatedAt"),
  };
};

const buildDefaultMeta = (
  dataLength: number,
  params?: ModifierCategoryListParams
): ModifierCategoriesMeta => ({
  page: params?.page ?? 1,
  limit: params?.limit ?? dataLength,
  total: dataLength,
  totalPages: 1,
  hasNext: false,
  hasPrevious: false,
});

const normalizeMeta = (
  response: unknown,
  dataLength: number,
  params?: ModifierCategoryListParams
): ModifierCategoriesMeta => {
  const extracted = extractResponseMeta(response);
  const fallback = buildDefaultMeta(dataLength, params);

  if (!extracted) return fallback;

  const page = Number(extracted.page ?? fallback.page);
  const limit = Number(extracted.limit ?? fallback.limit);
  const total = Number(extracted.total ?? dataLength);
  const totalPages = Number(
    extracted.totalPages ??
      extracted.pages ??
      (limit > 0 ? Math.ceil(total / limit) : fallback.totalPages)
  );

  return {
    ...extracted,
    page,
    limit,
    total,
    totalPages: totalPages || fallback.totalPages,
    hasNext:
      typeof extracted.hasNext === "boolean"
        ? extracted.hasNext
        : page < (totalPages || fallback.totalPages),
    hasPrevious:
      typeof extracted.hasPrevious === "boolean"
        ? extracted.hasPrevious
        : Boolean(extracted.hasPrev) || page > 1,
  };
};

export const normalizeModifierCategoriesResponse = (
  response: unknown,
  params?: ModifierCategoryListParams
): ModifierCategoriesListResponse => {
  const data = extractResponseItems(response, "modifierCategories")
    .map(normalizeModifierCategory)
    .filter((category): category is ModifierCategory => Boolean(category));
  const record = isRecord(response) ? response : {};

  return {
    success:
      typeof record.success === "boolean" ? record.success : undefined,
    data,
    meta: normalizeMeta(response, data.length, params),
    message: typeof record.message === "string" ? record.message : undefined,
  };
};

export const getModifierCategories = async (
  params?: ModifierCategoryListParams
): Promise<ModifierCategoriesListResponse> => {
  const response = await httpClient.get<unknown>(MODIFIER_CATEGORIES_ENDPOINT, {
    params: cleanParams(params),
  });

  return normalizeModifierCategoriesResponse(response, params);
};

export const createModifierCategory = (
  payload: ModifierCategoryCreatePayload
) =>
  httpClient.post<unknown, ModifierCategoryCreatePayload>(
    MODIFIER_CATEGORIES_ENDPOINT,
    payload
  );

export const updateModifierCategory = (
  id: string,
  payload: ModifierCategoryUpdatePayload
) =>
  httpClient.patch<unknown, ModifierCategoryUpdatePayload>(
    `${MODIFIER_CATEGORIES_ENDPOINT}/${id}`,
    payload
  );

export const deleteModifierCategory = (id: string) =>
  httpClient.delete<unknown>(`${MODIFIER_CATEGORIES_ENDPOINT}/${id}`);
