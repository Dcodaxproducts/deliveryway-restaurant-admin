import type { TableReservationsFilterState } from "@/components/pages/TableReservations/components/TableReservationsFilters";
import {
  TABLE_RESERVATIONS_DEFAULT_LIMIT,
  TABLE_RESERVATIONS_LIMIT_OPTIONS,
  TABLE_RESERVATIONS_MAX_LIMIT,
} from "@/types/table-reservations";

export const TABLE_RESERVATIONS_ROUTE = "/table-reservations";

/**
 * Statuses accepted by the admin list `status` filter. The list endpoint validates this
 * value, so anything else falls back to "ALL" rather than producing a failing request.
 */
export const TABLE_RESERVATION_FILTER_STATUSES = [
  "REQUESTED",
  "CONFIRMED",
  "SEATED",
  "COMPLETED",
  "CANCELLED",
] as const;

/**
 * Sort fields the API actually applies; unknown fields silently fall back to `createdAt`.
 */
export const TABLE_RESERVATION_SORT_FIELDS = ["reservationDate", "createdAt", "guestCount"] as const;

export type TableReservationsListState = {
  filters: TableReservationsFilterState;
  page: number;
  limit: number;
};

export const defaultTableReservationsFilters: TableReservationsFilterState = {
  search: "",
  status: "ALL",
  sortBy: "reservationDate",
  sortOrder: "DESC",
  branchId: "",
};

export const defaultTableReservationsListState: TableReservationsListState = {
  filters: defaultTableReservationsFilters,
  page: 1,
  limit: TABLE_RESERVATIONS_DEFAULT_LIMIT,
};

type SearchParamsLike = {
  get(name: string): string | null;
};

export const parseTableReservationsPage = (value: string | number | null | undefined): number => {
  const parsed = typeof value === "number" ? value : Number.parseInt(String(value ?? ""), 10);
  return Number.isInteger(parsed) && parsed >= 1 ? parsed : 1;
};

export const parseTableReservationsLimit = (value: string | number | null | undefined): number => {
  const parsed = typeof value === "number" ? value : Number.parseInt(String(value ?? ""), 10);
  if (!Number.isInteger(parsed) || parsed < 1) return TABLE_RESERVATIONS_DEFAULT_LIMIT;
  if ((TABLE_RESERVATIONS_LIMIT_OPTIONS as readonly number[]).includes(parsed)) return parsed;

  return Math.min(parsed, TABLE_RESERVATIONS_MAX_LIMIT);
};

const parseStatus = (value: string | null) => {
  const status = value?.trim().toUpperCase();
  return status && (TABLE_RESERVATION_FILTER_STATUSES as readonly string[]).includes(status)
    ? status
    : "ALL";
};

const parseSortBy = (value: string | null) =>
  value && (TABLE_RESERVATION_SORT_FIELDS as readonly string[]).includes(value)
    ? value
    : defaultTableReservationsFilters.sortBy;

const parseSortOrder = (value: string | null): "ASC" | "DESC" =>
  value?.toUpperCase() === "ASC" ? "ASC" : "DESC";

export const parseTableReservationsListState = (
  searchParams: SearchParamsLike | null | undefined
): TableReservationsListState => {
  if (!searchParams) return defaultTableReservationsListState;

  return {
    filters: {
      search: searchParams.get("search")?.trim() ?? "",
      status: parseStatus(searchParams.get("status")),
      sortBy: parseSortBy(searchParams.get("sortBy")),
      sortOrder: parseSortOrder(searchParams.get("sortOrder")),
      branchId: searchParams.get("branchId")?.trim() ?? "",
    },
    page: parseTableReservationsPage(searchParams.get("page")),
    limit: parseTableReservationsLimit(searchParams.get("limit")),
  };
};

/**
 * Serializes the list state, omitting defaults so the canonical list URL stays clean.
 */
export const buildTableReservationsQueryString = (state: TableReservationsListState): string => {
  const params = new URLSearchParams();
  const { filters, page, limit } = state;

  if (filters.search) params.set("search", filters.search);
  if (filters.status && filters.status !== "ALL") params.set("status", filters.status);
  if (filters.sortBy !== defaultTableReservationsFilters.sortBy) params.set("sortBy", filters.sortBy);
  if (filters.sortOrder !== defaultTableReservationsFilters.sortOrder) {
    params.set("sortOrder", filters.sortOrder);
  }
  if (filters.branchId) params.set("branchId", filters.branchId);
  if (page > 1) params.set("page", String(page));
  if (limit !== TABLE_RESERVATIONS_DEFAULT_LIMIT) params.set("limit", String(limit));

  const serialized = params.toString();
  return serialized ? `?${serialized}` : "";
};

export const buildTableReservationsListHref = (state: TableReservationsListState) =>
  `${TABLE_RESERVATIONS_ROUTE}${buildTableReservationsQueryString(state)}`;

export const buildTableReservationDetailHref = (
  reservationId: string,
  listQuery: string = ""
) => `${TABLE_RESERVATIONS_ROUTE}/${encodeURIComponent(reservationId)}${listQuery}`;

/**
 * Keeps only the list-owned keys from an arbitrary query string so a detail page can hand
 * the user back to exactly the list view they came from.
 */
export const preserveTableReservationsListQuery = (
  searchParams: SearchParamsLike | null | undefined
): string => buildTableReservationsQueryString(parseTableReservationsListState(searchParams));
