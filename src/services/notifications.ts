import api from "@/lib/axios";
import type {
  AdminNotification,
  AdminNotificationMetadata,
  AdminNotificationsResponse,
} from "@/types/notifications";

export type GetNotificationsParams = {
  restaurantId: string;
  branchId?: string;
  status?: "pending" | "seen";
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const getString = (source: Record<string, unknown>, key: string) => {
  const value = source[key];
  return typeof value === "string" ? value : "";
};

const getOptionalString = (source: Record<string, unknown>, key: string) => {
  const value = source[key];
  return typeof value === "string" ? value : null;
};

const getBoolean = (source: Record<string, unknown>, key: string) => {
  const value = source[key];
  return typeof value === "boolean" ? value : undefined;
};

const normalizeMetadata = (value: unknown): AdminNotificationMetadata | null => {
  if (!isRecord(value)) return null;

  return {
    ...value,
    reservationId: getString(value, "reservationId") || undefined,
    branchId: getString(value, "branchId") || undefined,
    customerId: getString(value, "customerId") || undefined,
  };
};

const normalizeNotification = (value: unknown): AdminNotification | null => {
  if (!isRecord(value)) return null;

  const id = getString(value, "id");
  const type = getString(value, "type");

  if (!id) return null;

  return {
    id,
    type,
    title: getOptionalString(value, "title"),
    message: getOptionalString(value, "message"),
    description: getOptionalString(value, "description"),
    status: getString(value, "status") || undefined,
    seen: getBoolean(value, "seen"),
    createdAt: getOptionalString(value, "createdAt"),
    metadata: normalizeMetadata(value.metadata),
  };
};

export const normalizeNotificationsResponse = (
  payload: unknown
): AdminNotificationsResponse => {
  const source = isRecord(payload) ? payload : {};
  const rawData = Array.isArray(source.data) ? source.data : [];
  const data = rawData
    .map((item) => normalizeNotification(item))
    .filter((item): item is AdminNotification => item !== null);
  const message = getString(source, "message") || undefined;

  return {
    data,
    ...(source.meta ? { meta: source.meta } : {}),
    ...(message ? { message } : {}),
  };
};

export const getNotifications = async (
  params: GetNotificationsParams
): Promise<AdminNotificationsResponse> => {
  const { data } = await api.get("/notifications", { params });
  return normalizeNotificationsResponse(data);
};

export const markAllNotificationsSeen = async () => {
  const { data } = await api.post("/notifications/seen-all");
  return data;
};
