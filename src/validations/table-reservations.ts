import { z } from "zod";

import { TABLE_RESERVATION_STATUS_VALUES } from "@/types/table-reservations";

/**
 * Validation messages are message codes resolved through `tableReservations.errors.*` so
 * English and German stay in parity at the presentation layer.
 */
export const TABLE_RESERVATION_ERROR_CODES = {
  statusRequired: "statusRequired",
  branchRequired: "branchRequired",
  guestCountRange: "guestCountRange",
  waitMinutesRange: "waitMinutesRange",
  guestNameTooLong: "guestNameTooLong",
  guestPhoneTooLong: "guestPhoneTooLong",
  noteTooLong: "noteTooLong",
  tableLabelTooLong: "tableLabelTooLong",
} as const;

export type TableReservationErrorCode =
  (typeof TABLE_RESERVATION_ERROR_CODES)[keyof typeof TABLE_RESERVATION_ERROR_CODES];

export const isTableReservationErrorCode = (
  value: unknown
): value is TableReservationErrorCode =>
  typeof value === "string" &&
  Object.values(TABLE_RESERVATION_ERROR_CODES).includes(value as TableReservationErrorCode);

export const tableReservationStatusUpdateSchema = z.object({
  status: z.enum(TABLE_RESERVATION_STATUS_VALUES, {
    errorMap: () => ({ message: TABLE_RESERVATION_ERROR_CODES.statusRequired }),
  }),
});

export type TableReservationStatusUpdateValues = z.infer<
  typeof tableReservationStatusUpdateSchema
>;

export const WALK_IN_GUEST_COUNT_MIN = 1;
export const WALK_IN_GUEST_COUNT_MAX = 50;
export const WALK_IN_WAIT_MINUTES_MIN = 1;
export const WALK_IN_WAIT_MINUTES_MAX = 240;
export const WALK_IN_DEFAULT_WAIT_MINUTES = 15;
export const WALK_IN_DEFAULT_GUEST_COUNT = 2;
export const TABLE_LABEL_MAX_LENGTH = 24;

const boundedInteger = (min: number, max: number, message: string) =>
  z
    .number({ required_error: message, invalid_type_error: message })
    .int({ message })
    .min(min, { message })
    .max(max, { message });

/**
 * Mirrors `CreatePosWalkInReservationDto`: guest count 1..50 plus optional guest details
 * and note. The expected wait is converted to a future `reservationDate` on submit.
 */
export const walkInReservationSchema = z.object({
  branchId: z.string().trim().min(1, { message: TABLE_RESERVATION_ERROR_CODES.branchRequired }),
  guestName: z.string().trim().max(80, { message: TABLE_RESERVATION_ERROR_CODES.guestNameTooLong }),
  guestPhone: z.string().trim().max(40, { message: TABLE_RESERVATION_ERROR_CODES.guestPhoneTooLong }),
  guestCount: boundedInteger(
    WALK_IN_GUEST_COUNT_MIN,
    WALK_IN_GUEST_COUNT_MAX,
    TABLE_RESERVATION_ERROR_CODES.guestCountRange
  ),
  waitMinutes: boundedInteger(
    WALK_IN_WAIT_MINUTES_MIN,
    WALK_IN_WAIT_MINUTES_MAX,
    TABLE_RESERVATION_ERROR_CODES.waitMinutesRange
  ),
  note: z.string().trim().max(500, { message: TABLE_RESERVATION_ERROR_CODES.noteTooLong }),
});

export type WalkInReservationFormValues = z.infer<typeof walkInReservationSchema>;

export const tableLabelSchema = z.object({
  tableLabel: z
    .string()
    .trim()
    .max(TABLE_LABEL_MAX_LENGTH, { message: TABLE_RESERVATION_ERROR_CODES.tableLabelTooLong }),
});

export type TableLabelFormValues = z.infer<typeof tableLabelSchema>;

export const buildWalkInReservationDate = (waitMinutes: number, now = new Date()) =>
  new Date(
    now.getTime() + Math.max(waitMinutes, WALK_IN_WAIT_MINUTES_MIN) * 60_000
  ).toISOString();
