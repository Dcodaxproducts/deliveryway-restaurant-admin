import { httpClient } from "@/lib/axios";
import { cleanParams } from "@/lib/params";
import { extractResponseItems, extractResponseMeta } from "@/lib/response";
import type {
  Cuisine,
  CuisineBulkCreatePayload,
  CuisineCreatePayload,
  CuisineListParams,
  CuisineReorderPayload,
  CuisineUpdatePayload,
  CuisinesListResponse,
  CuisinesMeta,
} from "@/types/cuisines";

const CUISINES_ENDPOINT = "/menu/cuisines";

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

export const normalizeCuisine = (cuisine: unknown): Cuisine | null => {
  if (!isRecord(cuisine)) return null;

  const id = getString(cuisine, "id");
  const name = getString(cuisine, "name");

  if (!id || !name) return null;

  return {
    id,
    restaurantId: getNullableString(cuisine, "restaurantId"),
    name,
    slug: getString(cuisine, "slug"),
    description: getNullableString(cuisine, "description"),
    imageUrl: getNullableString(cuisine, "imageUrl"),
    sortOrder: getOptionalNumber(cuisine, "sortOrder"),
    isActive: getOptionalBoolean(cuisine, "isActive"),
    createdAt: getOptionalString(cuisine, "createdAt"),
    updatedAt: getOptionalString(cuisine, "updatedAt"),
  };
};

const buildDefaultMeta = (
  dataLength: number,
  params?: CuisineListParams
): CuisinesMeta => ({
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
  params?: CuisineListParams
): CuisinesMeta => {
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

export const normalizeCuisinesResponse = (
  response: unknown,
  params?: CuisineListParams
): CuisinesListResponse => {
  const data = extractResponseItems(response, "cuisines")
    .map(normalizeCuisine)
    .filter((cuisine): cuisine is Cuisine => Boolean(cuisine));
  const record = isRecord(response) ? response : {};

  return {
    success: typeof record.success === "boolean" ? record.success : undefined,
    data,
    meta: normalizeMeta(response, data.length, params),
    message: typeof record.message === "string" ? record.message : undefined,
  };
};

export const getCuisines = async (
  params?: CuisineListParams
): Promise<CuisinesListResponse> => {
  const response = await httpClient.get<unknown>(CUISINES_ENDPOINT, {
    params: cleanParams(params),
  });

  return normalizeCuisinesResponse(response, params);
};

export const getCuisine = (id: string) =>
  httpClient.get<unknown>(`${CUISINES_ENDPOINT}/${id}`);

export const createCuisine = (payload: CuisineCreatePayload) =>
  httpClient.post<unknown, CuisineCreatePayload>(CUISINES_ENDPOINT, payload);

export const bulkCreateCuisines = (payload: CuisineBulkCreatePayload) =>
  httpClient.post<unknown, CuisineBulkCreatePayload>(
    `${CUISINES_ENDPOINT}/bulk`,
    payload
  );

export const updateCuisine = (id: string, payload: CuisineUpdatePayload) =>
  httpClient.patch<unknown, CuisineUpdatePayload>(
    `${CUISINES_ENDPOINT}/${id}`,
    payload
  );

export const reorderCuisines = (payload: CuisineReorderPayload) =>
  httpClient.patch<unknown, CuisineReorderPayload>(
    `${CUISINES_ENDPOINT}/reorder`,
    payload
  );

export const deleteCuisine = (id: string) =>
  httpClient.delete<unknown>(`${CUISINES_ENDPOINT}/${id}`);
