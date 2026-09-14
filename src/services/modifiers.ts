import { httpClient } from "@/lib/axios";
import { cleanParams } from "@/lib/params";
import { extractResponseItems, extractResponseMeta } from "@/lib/response";
import type {
  Modifier,
  ModifierCategorySummary,
  ModifierGroupSummary,
  ModifierCreatePayload,
  ModifierListParams,
  ModifiersListResponse,
  ModifiersMeta,
  ModifierUpdatePayload,
} from "@/types/modifiers";
import type { AttachModifierToGroupPayload } from "@/types/modifier-groups";

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

const normalizeModifierGroupSummary = (
  group: unknown
): ModifierGroupSummary | null => {
  if (!isRecord(group)) return null;

  const id = getString(group, "id");
  const name = getString(group, "name");

  if (!id || !name) return null;

  return {
    id,
    name,
    description: getNullableString(group, "description"),
    minSelect: getOptionalNumber(group, "minSelect") ?? 0,
    maxSelect: getOptionalNumber(group, "maxSelect") ?? 1,
    isRequired: getOptionalBoolean(group, "isRequired"),
    sortOrder: getOptionalNumber(group, "sortOrder"),
    isActive: getOptionalBoolean(group, "isActive"),
  };
};

export const normalizeModifier = (modifier: unknown): Modifier | null => {
  if (!isRecord(modifier)) return null;

  const id = getString(modifier, "id");
  const name = getString(modifier, "name");
  const category = normalizeCategorySummary(modifier.category);
  const categoryId = getString(modifier, "categoryId") || category?.id || "";
  const modifierGroups = Array.isArray(modifier.modifierGroups)
    ? modifier.modifierGroups
        .map(normalizeModifierGroupSummary)
        .filter((group): group is ModifierGroupSummary => Boolean(group))
    : [];

  if (!id || !name) return null;

  return {
    id,
    restaurantId: getNullableString(modifier, "restaurantId"),
    categoryId,
    category,
    modifierGroups,
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

export const normalizeModifierResponse = (response: unknown) => {
  if (isRecord(response) && "data" in response) {
    return normalizeModifier(response.data);
  }

  return normalizeModifier(response);
};

export const createModifier = async (payload: ModifierCreatePayload) => {
  const createPayload = {
    ...payload,
  } as ModifierCreatePayload & { isActive?: boolean };
  delete createPayload.isActive;

  const response = await httpClient.post<unknown, ModifierCreatePayload>(
    MODIFIERS_ENDPOINT,
    createPayload
  );

  return normalizeModifierResponse(response);
};

export const updateModifier = async (
  id: string,
  payload: ModifierUpdatePayload
) => {
  const response = await httpClient.patch<unknown, ModifierUpdatePayload>(
    `${MODIFIERS_ENDPOINT}/${id}`,
    payload
  );

  return normalizeModifierResponse(response);
};

export const syncModifierGroupLinks = async ({
  modifierId,
  previousGroupIds,
  nextGroupIds,
  sortOrder,
}: {
  modifierId: string;
  previousGroupIds: string[];
  nextGroupIds: string[];
  sortOrder?: number;
}) => {
  const previous = new Set(previousGroupIds);
  const next = new Set(nextGroupIds);
  const groupIdsToAttach = nextGroupIds.filter((groupId) => !previous.has(groupId));
  const groupIdsToDetach = previousGroupIds.filter((groupId) => !next.has(groupId));

  await Promise.all([
    ...groupIdsToAttach.map((groupId) =>
      httpClient.post<unknown, AttachModifierToGroupPayload>(
        `/menu/modifier-groups/${groupId}/modifiers/${modifierId}`,
        { sortOrder }
      )
    ),
    ...groupIdsToDetach.map((groupId) =>
      httpClient.delete<unknown>(
        `/menu/modifier-groups/${groupId}/modifiers/${modifierId}`
      )
    ),
  ]);
};

export const deleteModifier = (id: string) =>
  httpClient.delete<unknown>(`${MODIFIERS_ENDPOINT}/${id}`);
