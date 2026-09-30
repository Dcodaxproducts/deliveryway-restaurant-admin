import { httpClient } from "@/lib/axios";
import { cleanParams } from "@/lib/params";
import {
  normalizeTableReservationDetail,
  normalizeTableReservationsResponse,
  type TableReservation,
  type TableReservationAssignmentPayload,
  type TableReservationScopeParams,
  type TableReservationsParams,
  type TableReservationsResponse,
  type TableReservationStatusUpdatePayload,
  type WalkInReservationCreatePayload,
} from "@/types/table-reservations";

/**
 * Routes of the platform API `CustomerAppController` admin reservation surface.
 * All of them carry `@PosPrinterAccess()`, so POS printer tokens may call them.
 */
export const TABLE_RESERVATIONS_ENDPOINT = "/customer-app/admin/table-reservations";
export const WALK_IN_RESERVATIONS_ENDPOINT = `${TABLE_RESERVATIONS_ENDPOINT}/walk-ins`;

export const getTableReservationDetailEndpoint = (reservationId: string) =>
  `${TABLE_RESERVATIONS_ENDPOINT}/${encodeURIComponent(reservationId)}`;

export const getTableReservationStatusEndpoint = (reservationId: string) =>
  `${getTableReservationDetailEndpoint(reservationId)}/status`;

export const getTableReservationAssignmentEndpoint = (reservationId: string) =>
  `${getTableReservationDetailEndpoint(reservationId)}/assignment`;

export async function getTableReservations(
  params: TableReservationsParams
): Promise<TableReservationsResponse> {
  const response = await httpClient.get<unknown>(TABLE_RESERVATIONS_ENDPOINT, {
    params: cleanParams(params),
  });

  return normalizeTableReservationsResponse(response, params);
}

/**
 * `GET /customer-app/admin/table-reservations/:reservationId`. Resolves `null` when the
 * API answers without a reservation so callers can render a not-found state.
 */
export async function getTableReservation(
  reservationId: string,
  scope: TableReservationScopeParams = {}
): Promise<TableReservation | null> {
  const response = await httpClient.get<unknown>(
    getTableReservationDetailEndpoint(reservationId),
    { params: cleanParams(scope) }
  );

  return normalizeTableReservationDetail(response);
}

const requireReservation = (response: unknown): TableReservation => {
  const reservation = normalizeTableReservationDetail(response);

  if (!reservation) {
    throw new Error("Invalid table reservation response");
  }

  return reservation;
};

export async function updateTableReservationStatus(
  reservationId: string,
  payload: TableReservationStatusUpdatePayload
): Promise<TableReservation> {
  const response = await httpClient.patch<unknown, Partial<TableReservationStatusUpdatePayload>>(
    getTableReservationStatusEndpoint(reservationId),
    cleanParams({
      status: payload.status,
      restaurantId: payload.restaurantId,
      branchId: payload.branchId,
      customerId: payload.customerId,
    })
  );

  return requireReservation(response);
}

/** Exact body of `CreateAdminWalkInReservationDto`; optional keys are omitted when empty. */
export const buildWalkInReservationRequest = (payload: WalkInReservationCreatePayload) => ({
  customerId: payload.customerId,
  branchId: payload.branchId,
  guestCount: payload.guestCount,
  ...cleanParams({
    tableLabel: payload.tableLabel?.trim(),
    note: payload.note?.trim(),
    restaurantId: payload.restaurantId,
  }),
});

/**
 * `POST /customer-app/admin/table-reservations/walk-ins` creates a CONFIRMED, waiting
 * reservation for an existing customer. The response carries the bare reservation record.
 */
export async function createWalkInReservation(
  payload: WalkInReservationCreatePayload
): Promise<TableReservation> {
  const response = await httpClient.post<unknown, ReturnType<typeof buildWalkInReservationRequest>>(
    WALK_IN_RESERVATIONS_ENDPOINT,
    buildWalkInReservationRequest(payload)
  );

  return requireReservation(response);
}

/** Exact body of `AssignAdminTableReservationDto`; `tableLabel` is always sent. */
export const buildTableReservationAssignmentRequest = (
  payload: TableReservationAssignmentPayload
) => ({
  tableLabel: payload.tableLabel.trim(),
  ...cleanParams({
    restaurantId: payload.restaurantId,
    branchId: payload.branchId,
    customerId: payload.customerId,
  }),
});

/**
 * `PATCH /customer-app/admin/table-reservations/:reservationId/assignment` persists the
 * table label on the reservation. The returned reservation is the source of truth.
 */
export async function assignTableReservation(
  reservationId: string,
  payload: TableReservationAssignmentPayload
): Promise<TableReservation> {
  const response = await httpClient.patch<
    unknown,
    ReturnType<typeof buildTableReservationAssignmentRequest>
  >(getTableReservationAssignmentEndpoint(reservationId), buildTableReservationAssignmentRequest(payload));

  return requireReservation(response);
}
