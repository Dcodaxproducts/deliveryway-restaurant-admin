export type TableReservationStatus =
  | "REQUESTED"
  | "CONFIRMED"
  | "CANCELLED"
  | "COMPLETED"
  | "NO_SHOW"
  | "SEATED"
  | string;

export type TableReservationStatusUpdateValue =
  | "REQUESTED"
  | "CONFIRMED"
  | "SEATED"
  | "COMPLETED"
  | "CANCELLED";

export type TableReservationStatusUpdatePayload = {
  status: TableReservationStatusUpdateValue;
  restaurantId?: string;
  branchId?: string;
  customerId?: string;
};

export const TABLE_RESERVATION_STATUS_OPTIONS: Array<{
  value: TableReservationStatusUpdateValue;
  label: string;
}> = [
  { value: "REQUESTED", label: "Requested" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "SEATED", label: "Seated" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

export type TableReservationCustomer = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  avatarUrl: string | null;
};

export type TableReservationBranch = {
  id?: string;
  name?: string;
  address?: string | null;
} | null;

export type TableReservation = {
  id: string;
  branchId: string | null;
  reservationDate: string;
  guestCount: number;
  note: string | null;
  status: TableReservationStatus;
  createdAt: string;
  cancelledAt: string | null;
  customer: TableReservationCustomer | null;
  branch: TableReservationBranch;
};

export type TableReservationsMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
};

export type TableReservationsParams = {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
  restaurantId?: string;
  branchId?: string;
  customerId?: string;
  status?: string;
};

export type TableReservationsResponse = {
  reservations: TableReservation[];
  meta: TableReservationsMeta;
  message?: string;
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

export const getDefaultTableReservationsMeta = (
  params: TableReservationsParams = {}
): TableReservationsMeta => ({
  page: params.page ?? 1,
  limit: params.limit ?? 20,
  total: 0,
  totalPages: 1,
  hasNext: false,
  hasPrevious: false,
});

export const normalizeTableReservationCustomer = (
  value: unknown
): TableReservationCustomer | null => {
  if (!isRecord(value)) return null;

  return {
    id: getString(value, "id"),
    email: getString(value, "email"),
    firstName: getString(value, "firstName"),
    lastName: getString(value, "lastName"),
    phone: getNullableString(value, "phone"),
    avatarUrl: getNullableString(value, "avatarUrl"),
  };
};

export const normalizeTableReservationBranch = (
  value: unknown
): TableReservationBranch => {
  if (!isRecord(value)) return null;

  return {
    id: getString(value, "id") || undefined,
    name: getString(value, "name") || undefined,
    address: getNullableString(value, "address"),
  };
};

export const normalizeTableReservation = (value: unknown): TableReservation | null => {
  if (!isRecord(value)) return null;

  return {
    id: getString(value, "id"),
    branchId: getNullableString(value, "branchId"),
    reservationDate: getString(value, "reservationDate"),
    guestCount: getNumber(value, "guestCount"),
    note: getNullableString(value, "note"),
    status: getString(value, "status", "REQUESTED"),
    createdAt: getString(value, "createdAt"),
    cancelledAt: getNullableString(value, "cancelledAt"),
    customer: normalizeTableReservationCustomer(value.customer),
    branch: normalizeTableReservationBranch(value.branch),
  };
};

export const normalizeTableReservationsMeta = (
  value: unknown,
  params: TableReservationsParams = {}
): TableReservationsMeta => {
  if (!isRecord(value)) return getDefaultTableReservationsMeta(params);

  return {
    page: getNumber(value, "page", params.page ?? 1),
    limit: getNumber(value, "limit", params.limit ?? 20),
    total: getNumber(value, "total"),
    totalPages: getNumber(value, "totalPages", 1),
    hasNext: getBoolean(value, "hasNext"),
    hasPrevious: getBoolean(value, "hasPrevious"),
  };
};

export const normalizeTableReservationsResponse = (
  payload: unknown,
  params: TableReservationsParams = {}
): TableReservationsResponse => {
  const source = isRecord(payload) ? payload : {};
  const data = Array.isArray(source.data) ? source.data : [];
  const reservations = data
    .map((item) => normalizeTableReservation(item))
    .filter((item): item is TableReservation => item !== null);
  const message = typeof source.message === "string" ? source.message : undefined;

  return {
    reservations,
    meta: normalizeTableReservationsMeta(source.meta, params),
    ...(message ? { message } : {}),
  };
};
