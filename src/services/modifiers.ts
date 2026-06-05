import { httpClient } from "@/lib/axios";
import { cleanParams } from "@/lib/params";
import { extractResponseItems, extractResponseMeta } from "@/lib/response";
import type {
  Modifier,
  ModifierCategorySummary,
  ModifierCreatePayload,
  ModifierListParams,
  ModifiersListResponse,
  ModifiersMeta,
  ModifierUpdatePayload,
} from "@/types/modifiers";

const MODIFIERS_ENDPOINT = "/menu/modifiers";

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

const normalizeCategorySummary = (
  category: unknown
): ModifierCategorySummary | null => {
  if (!isRecord(category)) return null;

  const id = getString(category, "id");
  const name = getString(category, "name");

  if (!id || !name) return null;

  return {
    id,
    name,
    slug: getOptionalString(category, "slug"),
  };
};

export const normalizeModifier = (modifier: unknown): Modifier | null => {
  if (!isRecord(modifier)) return null;

  const id = getString(modifier, "id");
  const name = getString(modifier, "name");
  const category = normalizeCategorySummary(modifier.category);
  const categoryId = getString(modifier, "categoryId") || category?.id || "";

  if (!id || !name) return null;

  return {
    id,
    restaurantId: getNullableString(modifier, "restaurantId"),
    categoryId,
    category,
    name,
    priceDelta: getOptionalNumber(modifier, "priceDelta"),
    sortOrder: getOptionalNumber(modifier, "sortOrder"),
    isActive: getOptionalBoolean(modifier, "isActive"),
    createdAt: getOptionalString(modifier, "createdAt"),
    updatedAt: getOptionalString(modifier, "updatedAt"),
  };
};

const buildDefaultMeta = (
  dataLength: number,
  params?: ModifierListParams
): ModifiersMeta => ({
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
  params?: ModifierListParams
): ModifiersMeta => {
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

export const normalizeModifiersResponse = (
  response: unknown,
  params?: ModifierListParams
): ModifiersListResponse => {
  const data = extractResponseItems(response, "modifiers")
    .map(normalizeModifier)
    .filter((modifier): modifier is Modifier => Boolean(modifier));
  const record = isRecord(response) ? response : {};

  return {
    success:
      typeof record.success === "boolean" ? record.success : undefined,
    data,
    meta: normalizeMeta(response, data.length, params),
    message: typeof record.message === "string" ? record.message : undefined,
  };
};

export const getModifiers = async (
  params?: ModifierListParams
): Promise<ModifiersListResponse> => {
  const response = await httpClient.get<unknown>(MODIFIERS_ENDPOINT, {
    params: cleanParams(params),
  });

  return normalizeModifiersResponse(response, params);
};

export const createModifier = (payload: ModifierCreatePayload) => {
  const createPayload = {
    ...payload,
  } as ModifierCreatePayload & { isActive?: boolean };
  delete createPayload.isActive;

  return httpClient.post<unknown, ModifierCreatePayload>(
    MODIFIERS_ENDPOINT,
    createPayload
  );
};

export const updateModifier = (id: string, payload: ModifierUpdatePayload) =>
  httpClient.patch<unknown, ModifierUpdatePayload>(
    `${MODIFIERS_ENDPOINT}/${id}`,
    payload
  );

export const deleteModifier = (id: string) =>
  httpClient.delete<unknown>(`${MODIFIERS_ENDPOINT}/${id}`);
