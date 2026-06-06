import { httpClient } from "@/lib/axios";
import { cleanParams } from "@/lib/params";
import { extractResponseItems, extractResponseMeta } from "@/lib/response";
import type {
  AttachModifierToGroupPayload,
  DetachModifierFromGroupResponse,
  ModifierGroup,
  ModifierGroupCreatePayload,
  ModifierGroupListParams,
  ModifierGroupModifier,
  ModifierGroupsListResponse,
  ModifierGroupsMeta,
  ModifierGroupUpdatePayload,
} from "@/types/modifier-groups";

const MODIFIER_GROUPS_ENDPOINT = "/menu/modifier-groups";

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

const getNumber = (
  record: Record<string, unknown>,
  key: string,
  fallback: number
) => {
  const value = record[key];

  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  return fallback;
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

const normalizeModifierCategory = (category: unknown) => {
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

export const normalizeModifierGroupModifier = (
  modifier: unknown
): ModifierGroupModifier | null => {
  if (!isRecord(modifier)) return null;

  const nestedModifier = isRecord(modifier.modifier) ? modifier.modifier : null;
  const source = nestedModifier ?? modifier;
  const id =
    getString(source, "id") ||
    getString(modifier, "modifierId") ||
    getString(modifier, "id");
  const name = getString(source, "name");

  if (!id || !name) return null;

  return {
    id,
    name,
    priceDelta:
      getOptionalNumber(source, "priceDelta") ??
      getOptionalString(source, "priceDelta") ??
      null,
    sortOrder: getOptionalNumber(modifier, "sortOrder"),
    category: normalizeModifierCategory(source.category),
  };
};

export const normalizeModifierGroup = (group: unknown): ModifierGroup | null => {
  if (!isRecord(group)) return null;

  const id = getString(group, "id");
  const name = getString(group, "name");

  if (!id || !name) return null;

  const rawModifiers = Array.isArray(group.modifiers)
    ? group.modifiers
    : Array.isArray(group.groupModifiers)
    ? group.groupModifiers
    : [];

  return {
    id,
    restaurantId: getNullableString(group, "restaurantId"),
    name,
    description: getNullableString(group, "description"),
    minSelect: getNumber(group, "minSelect", 0),
    maxSelect: getNumber(group, "maxSelect", 0),
    sortOrder: getOptionalNumber(group, "sortOrder"),
    isActive: getOptionalBoolean(group, "isActive"),
    modifiers: rawModifiers
      .map(normalizeModifierGroupModifier)
      .filter((modifier): modifier is ModifierGroupModifier =>
        Boolean(modifier)
      ),
    createdAt: getOptionalString(group, "createdAt"),
    updatedAt: getOptionalString(group, "updatedAt"),
  };
};

const buildDefaultMeta = (
  dataLength: number,
  params?: ModifierGroupListParams
): ModifierGroupsMeta => ({
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
  params?: ModifierGroupListParams
): ModifierGroupsMeta => {
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

export const normalizeModifierGroupsResponse = (
  response: unknown,
  params?: ModifierGroupListParams
): ModifierGroupsListResponse => {
  const data = extractResponseItems(response, "modifierGroups")
    .map(normalizeModifierGroup)
    .filter((group): group is ModifierGroup => Boolean(group));
  const record = isRecord(response) ? response : {};

  return {
    success:
      typeof record.success === "boolean" ? record.success : undefined,
    data,
    meta: normalizeMeta(response, data.length, params),
    message: typeof record.message === "string" ? record.message : undefined,
  };
};

export const normalizeModifierGroupDetail = (
  response: unknown
): ModifierGroup | null => {
  if (isRecord(response) && "data" in response) {
    const data = response.data;

    if (isRecord(data) && "modifierGroup" in data) {
      return normalizeModifierGroup(data.modifierGroup);
    }

    return normalizeModifierGroup(data);
  }

  return normalizeModifierGroup(response);
};

export const getModifierGroups = async (
  params?: ModifierGroupListParams
): Promise<ModifierGroupsListResponse> => {
  const response = await httpClient.get<unknown>(MODIFIER_GROUPS_ENDPOINT, {
    params: cleanParams(params),
  });

  return normalizeModifierGroupsResponse(response, params);
};

export const getModifierGroup = async (
  id: string,
  params?: Pick<ModifierGroupListParams, "restaurantId">
): Promise<ModifierGroup | null> => {
  const response = await httpClient.get<unknown>(
    `${MODIFIER_GROUPS_ENDPOINT}/${id}`,
    {
      params: cleanParams(params),
    }
  );

  return normalizeModifierGroupDetail(response);
};

export const createModifierGroup = (payload: ModifierGroupCreatePayload) =>
  httpClient.post<unknown, ModifierGroupCreatePayload>(
    MODIFIER_GROUPS_ENDPOINT,
    payload
  );

export const updateModifierGroup = (
  id: string,
  payload: ModifierGroupUpdatePayload
) =>
  httpClient.patch<unknown, ModifierGroupUpdatePayload>(
    `${MODIFIER_GROUPS_ENDPOINT}/${id}`,
    payload
  );

export const deleteModifierGroup = (id: string) =>
  httpClient.delete<unknown>(`${MODIFIER_GROUPS_ENDPOINT}/${id}`);

export const attachModifierToGroup = (
  groupId: string,
  modifierId: string,
  payload: AttachModifierToGroupPayload
) =>
  httpClient.post<unknown, AttachModifierToGroupPayload>(
    `${MODIFIER_GROUPS_ENDPOINT}/${groupId}/modifiers/${modifierId}`,
    payload
  );

export const normalizeDetachModifierFromGroupResponse = (
  response: unknown,
  groupId: string,
  modifierId: string
): DetachModifierFromGroupResponse => {
  const data = isRecord(response) && isRecord(response.data)
    ? response.data
    : isRecord(response)
    ? response
    : {};

  return {
    modifierGroupId: getString(data, "modifierGroupId") || groupId,
    modifierId: getString(data, "modifierId") || modifierId,
  };
};

export const detachModifierFromGroup = async (
  groupId: string,
  modifierId: string
): Promise<DetachModifierFromGroupResponse> => {
  const response = await httpClient.delete<unknown>(
    `${MODIFIER_GROUPS_ENDPOINT}/${groupId}/modifiers/${modifierId}`
  );

  return normalizeDetachModifierFromGroupResponse(response, groupId, modifierId);
};
