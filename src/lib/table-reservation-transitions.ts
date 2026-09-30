import {
  isTableReservationStatusUpdateValue,
  type TableReservationStatusUpdateValue,
} from "@/types/table-reservations";

/**
 * Allowed status transitions for a table reservation.
 *
 * - `NO_SHOW` is only valid while a guest is still expected (REQUESTED or CONFIRMED).
 *   A seated, completed, cancelled, or already no-show reservation can never become a no-show.
 * - `COMPLETED` is only valid after the guest has been seated.
 * - `COMPLETED`, `CANCELLED`, and `NO_SHOW` are terminal.
 */
export const TABLE_RESERVATION_TRANSITIONS: Readonly<
  Record<TableReservationStatusUpdateValue, readonly TableReservationStatusUpdateValue[]>
> = {
  REQUESTED: ["CONFIRMED", "SEATED", "NO_SHOW", "CANCELLED"],
  CONFIRMED: ["SEATED", "NO_SHOW", "CANCELLED"],
  SEATED: ["COMPLETED", "CANCELLED"],
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
