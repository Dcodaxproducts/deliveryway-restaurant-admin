export type TableReservationStatus =
  | "REQUESTED"
  | "CONFIRMED"
  | "CANCELLED"
  | "COMPLETED"
  | "SEATED"
  | "NO_SHOW"
  | string;

export const TABLE_RESERVATION_STATUS_VALUES = [
  "REQUESTED",
  "CONFIRMED",
  "SEATED",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
] as const;

export type TableReservationStatusUpdateValue =
  (typeof TABLE_RESERVATION_STATUS_VALUES)[number];

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
  { value: "NO_SHOW", label: "No Show" },
];

export const isTableReservationStatusUpdateValue = (
  value: unknown
): value is TableReservationStatusUpdateValue =>
  typeof value === "string" &&
  (TABLE_RESERVATION_STATUS_VALUES as readonly string[]).includes(value);

/**
 * Page sizes supported by the admin list endpoint. The API caps `limit` at 50.
 */
export const TABLE_RESERVATIONS_LIMIT_OPTIONS = [10, 20, 50] as const;
export const TABLE_RESERVATIONS_DEFAULT_LIMIT = 20;
export const TABLE_RESERVATIONS_MAX_LIMIT = 50;

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

export type TableReservationScopeParams = Pick<
  TableReservationsParams,
  "restaurantId" | "branchId" | "customerId"
>;

export type TableReservationsResponse = {
  reservations: TableReservation[];
  meta: TableReservationsMeta;
  message?: string;
};

/**
 * Payload for `POST /pos/orders/walk-in-reservations`. Branch-scoped actors may omit
 * `branchId`; the API uses the token scope. `reservationDate` must be in the future.
 */
export type WalkInReservationCreatePayload = {
  branchId?: string;
  guestName?: string;
  guestPhone?: string;
  reservationDate: string;
  guestCount: number;
  note?: string;
};

export type WalkInReservationCreateResult = {
  reservation: TableReservation;
  customerId: string | null;
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
  limit: params.limit ?? TABLE_RESERVATIONS_DEFAULT_LIMIT,
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

/**
 * Accepts either a bare reservation or an `{ data: reservation }` envelope and returns
 * `null` when the payload does not carry a reservation with an id.
 */
export const normalizeTableReservationDetail = (payload: unknown): TableReservation | null => {
  const source = isRecord(payload) && "data" in payload ? payload.data : payload;
  const reservation = normalizeTableReservation(source);

  return reservation && reservation.id ? reservation : null;
};

export const normalizeWalkInReservationResult = (
  payload: unknown
): WalkInReservationCreateResult | null => {
  const envelope = isRecord(payload) ? payload : {};
  const source = "data" in envelope ? envelope.data : payload;
  const reservation = normalizeTableReservation(source);

  if (!reservation || !reservation.id) return null;

  const message = typeof envelope.message === "string" ? envelope.message : undefined;

  return {
    reservation,
    customerId: isRecord(source) ? getNullableString(source, "customerId") : null,
    ...(message ? { message } : {}),
  };
};

export const normalizeTableReservationsMeta = (
  value: unknown,
  params: TableReservationsParams = {}
): TableReservationsMeta => {
  if (!isRecord(value)) return getDefaultTableReservationsMeta(params);

  return {
    page: getNumber(value, "page", params.page ?? 1),
    limit: getNumber(value, "limit", params.limit ?? TABLE_RESERVATIONS_DEFAULT_LIMIT),
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
