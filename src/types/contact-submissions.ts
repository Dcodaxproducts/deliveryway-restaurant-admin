export type ContactSubmissionStatus = "NEW" | "READ" | "REPLIED" | "ARCHIVED" | string;

export type ContactSubmissionStatusUpdateValue =
  | "NEW"
  | "READ"
  | "REPLIED"
  | "ARCHIVED";

export type ContactSubmission = {
  id: string;
  restaurantId: string | null;
  branchId: string | null;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: ContactSubmissionStatus;
  createdAt: string | null;
  updatedAt: string | null;
  repliedAt: string | null;
  replySubject: string | null;
  replyMessage: string | null;
  restaurant: {
    id?: string;
    name?: string;
  } | null;
  branch: {
    id?: string;
    name?: string;
  } | null;
};

export type ContactSubmissionsMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
};

export type ContactSubmissionsParams = {
  page?: number;
  limit?: number;
  restaurantId?: string;
  branchId?: string;
  status?: string;
  search?: string;
};

export type ContactSubmissionsResponse = {
  submissions: ContactSubmission[];
  meta: ContactSubmissionsMeta;
  message?: string;
};

export type ContactSubmissionStatusPayload = {
  status: ContactSubmissionStatusUpdateValue;
};

export type ContactSubmissionReplyPayload = {
  subject: string;
  message: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const getString = (source: Record<string, unknown>, key: string, fallback = "") => {
  const value = source[key];
  return typeof value === "string" ? value : fallback;
};

const getNullableString = (source: Record<string, unknown>, key: string) => {
  const value = source[key];
  return typeof value === "string" ? value : null;
};

const getNumber = (source: Record<string, unknown>, key: string, fallback = 0) => {
  const value = source[key];
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
};

const getBoolean = (source: Record<string, unknown>, key: string, fallback = false) => {
  const value = source[key];
  return typeof value === "boolean" ? value : fallback;
};

const normalizeSmallEntity = (value: unknown): { id?: string; name?: string } | null => {
  if (!isRecord(value)) return null;

  return {
    id: getString(value, "id") || undefined,
    name: getString(value, "name") || undefined,
  };
};

export const getDefaultContactSubmissionsMeta = (
  params: ContactSubmissionsParams = {}
): ContactSubmissionsMeta => ({
  page: params.page ?? 1,
  limit: params.limit ?? 20,
  total: 0,
  totalPages: 1,
  hasNext: false,
  hasPrevious: false,
});

export const normalizeContactSubmission = (
  value: unknown
): ContactSubmission | null => {
  if (!isRecord(value)) return null;

  const id = getString(value, "id");
  if (!id) return null;

  return {
    id,
    restaurantId: getNullableString(value, "restaurantId"),
    branchId: getNullableString(value, "branchId"),
    name: getString(value, "name"),
    email: getString(value, "email"),
    subject: getString(value, "subject"),
    message: getString(value, "message"),
    status: getString(value, "status", "NEW"),
    createdAt: getNullableString(value, "createdAt"),
    updatedAt: getNullableString(value, "updatedAt"),
    repliedAt: getNullableString(value, "repliedAt"),
    replySubject: getNullableString(value, "replySubject"),
    replyMessage: getNullableString(value, "replyMessage"),
    restaurant: normalizeSmallEntity(value.restaurant),
    branch: normalizeSmallEntity(value.branch),
  };
};

export const normalizeContactSubmissionsMeta = (
  value: unknown,
  params: ContactSubmissionsParams = {}
): ContactSubmissionsMeta => {
  if (!isRecord(value)) return getDefaultContactSubmissionsMeta(params);

  return {
    page: getNumber(value, "page", params.page ?? 1),
    limit: getNumber(value, "limit", params.limit ?? 20),
    total: getNumber(value, "total"),
    totalPages: getNumber(value, "totalPages", 1),
    hasNext: getBoolean(value, "hasNext"),
    hasPrevious: getBoolean(value, "hasPrevious"),
  };
};

export const normalizeContactSubmissionsResponse = (
  payload: unknown,
  params: ContactSubmissionsParams = {}
): ContactSubmissionsResponse => {
  const source = isRecord(payload) ? payload : {};
  const rawData = Array.isArray(source.data) ? source.data : [];
  const submissions = rawData
    .map((item) => normalizeContactSubmission(item))
    .filter((item): item is ContactSubmission => item !== null);
  const message = getString(source, "message") || undefined;

  return {
    submissions,
    meta: normalizeContactSubmissionsMeta(source.meta, params),
    ...(message ? { message } : {}),
  };
};
