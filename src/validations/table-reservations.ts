import { z } from "zod";

import { TABLE_RESERVATION_STATUS_VALUES } from "@/types/table-reservations";

/**
 * Validation messages are message codes resolved through `tableReservations.errors.*` so
 * English and German stay in parity at the presentation layer.
 */
export const TABLE_RESERVATION_ERROR_CODES = {
  statusRequired: "statusRequired",
  customerRequired: "customerRequired",
  branchRequired: "branchRequired",
  guestCountRange: "guestCountRange",
  noteTooLong: "noteTooLong",
  tableLabelRequired: "tableLabelRequired",
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

/** `CreateAdminWalkInReservationDto` bounds: `guestCount` 1..50. */
export const WALK_IN_GUEST_COUNT_MIN = 1;
export const WALK_IN_GUEST_COUNT_MAX = 50;
export const WALK_IN_DEFAULT_GUEST_COUNT = 2;
/** Presentation cap; the API accepts any non-empty string. */
export const TABLE_LABEL_MAX_LENGTH = 24;
export const WALK_IN_NOTE_MAX_LENGTH = 500;

const boundedInteger = (min: number, max: number, message: string) =>
  z
    .number({ required_error: message, invalid_type_error: message })
    .int({ message })
    .min(min, { message })
    .max(max, { message });

const tableLabelField = z
  .string()
  .trim()
  .max(TABLE_LABEL_MAX_LENGTH, { message: TABLE_RESERVATION_ERROR_CODES.tableLabelTooLong });

/**
 * Mirrors `CreateAdminWalkInReservationDto`: an existing customer, a branch, guest count
 * 1..50, plus an optional table label and note.
 */
export const walkInReservationSchema = z.object({
  customerId: z
    .string()
    .trim()
    .min(1, { message: TABLE_RESERVATION_ERROR_CODES.customerRequired }),
  branchId: z.string().trim().min(1, { message: TABLE_RESERVATION_ERROR_CODES.branchRequired }),
  guestCount: boundedInteger(
    WALK_IN_GUEST_COUNT_MIN,
    WALK_IN_GUEST_COUNT_MAX,
    TABLE_RESERVATION_ERROR_CODES.guestCountRange
  ),
  tableLabel: tableLabelField,
  note: z
    .string()
    .trim()
    .max(WALK_IN_NOTE_MAX_LENGTH, { message: TABLE_RESERVATION_ERROR_CODES.noteTooLong }),
});

export type WalkInReservationFormValues = z.infer<typeof walkInReservationSchema>;

/** Mirrors `AssignAdminTableReservationDto`: `tableLabel` is required and non-blank. */
export const tableLabelSchema = z.object({
  tableLabel: tableLabelField.refine((value) => value.length > 0, {
    message: TABLE_RESERVATION_ERROR_CODES.tableLabelRequired,
  }),
});

export type TableLabelFormValues = z.infer<typeof tableLabelSchema>;
