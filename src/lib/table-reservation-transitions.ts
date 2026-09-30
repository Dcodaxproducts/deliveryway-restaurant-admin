import {
  isTableReservationStatusUpdateValue,
  type TableReservationStatusUpdateValue,
} from "@/types/table-reservations";

/**
 * Allowed status transitions for a table reservation. Mirrors
 * `CustomerAppService.assertTableReservationTransition` in the platform API exactly:
 *
 * - `REQUESTED` -> `CONFIRMED` | `CANCELLED` | `NO_SHOW`
 * - `CONFIRMED` -> `SEATED` | `CANCELLED` | `NO_SHOW`
 * - `SEATED` -> `COMPLETED`
 * - `COMPLETED`, `CANCELLED`, and `NO_SHOW` are terminal and reject every transition.
 *
 * A guest must be confirmed before being seated, and a seated guest can only complete.
 */
export const TABLE_RESERVATION_TRANSITIONS: Readonly<
  Record<TableReservationStatusUpdateValue, readonly TableReservationStatusUpdateValue[]>
> = {
  REQUESTED: ["CONFIRMED", "CANCELLED", "NO_SHOW"],
  CONFIRMED: ["SEATED", "CANCELLED", "NO_SHOW"],
  SEATED: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
  NO_SHOW: [],
};

export const TERMINAL_TABLE_RESERVATION_STATUSES: readonly TableReservationStatusUpdateValue[] = [
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
];

export const ACTIVE_TABLE_RESERVATION_STATUSES: readonly TableReservationStatusUpdateValue[] = [
  "REQUESTED",
  "CONFIRMED",
  "SEATED",
];

export const normalizeTableReservationStatus = (
  status: string | null | undefined
): TableReservationStatusUpdateValue | null => {
  const value = status?.trim().toUpperCase();
  return isTableReservationStatusUpdateValue(value) ? value : null;
};

export const getAllowedTableReservationTransitions = (
  status: string | null | undefined
): readonly TableReservationStatusUpdateValue[] => {
  const current = normalizeTableReservationStatus(status);
  return current ? TABLE_RESERVATION_TRANSITIONS[current] : [];
};

export const canTransitionTableReservation = (
  from: string | null | undefined,
  to: string | null | undefined
): boolean => {
  const target = normalizeTableReservationStatus(to);
  if (!target) return false;
  return getAllowedTableReservationTransitions(from).includes(target);
};

export const isTerminalTableReservationStatus = (status: string | null | undefined): boolean => {
  const current = normalizeTableReservationStatus(status);
  return current !== null && TERMINAL_TABLE_RESERVATION_STATUSES.includes(current);
};

export const isActiveTableReservationStatus = (status: string | null | undefined): boolean => {
  const current = normalizeTableReservationStatus(status);
  return current !== null && ACTIVE_TABLE_RESERVATION_STATUSES.includes(current);
};

/** Only non-terminal reservations accept a table assignment (API returns 400 otherwise). */
export const canAssignTableReservation = (status: string | null | undefined): boolean =>
  isActiveTableReservationStatus(status);
