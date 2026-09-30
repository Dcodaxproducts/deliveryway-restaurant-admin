import { httpClient } from "@/lib/axios";
import { cleanParams } from "@/lib/params";
import {
  normalizeTableReservationDetail,
  normalizeTableReservationsResponse,
  normalizeWalkInReservationResult,
  type TableReservation,
  type TableReservationScopeParams,
  type TableReservationsParams,
  type TableReservationsResponse,
  type TableReservationStatusUpdatePayload,
  type WalkInReservationCreatePayload,
  type WalkInReservationCreateResult,
} from "@/types/table-reservations";

export const TABLE_RESERVATIONS_ENDPOINT = "/customer-app/admin/table-reservations";
export const WALK_IN_RESERVATIONS_ENDPOINT = "/pos/orders/walk-in-reservations";

export const getTableReservationDetailEndpoint = (reservationId: string) =>
  `${TABLE_RESERVATIONS_ENDPOINT}/${encodeURIComponent(reservationId)}`;

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

export async function updateTableReservationStatus(
  reservationId: string,
  payload: TableReservationStatusUpdatePayload
): Promise<TableReservation> {
  const response = await httpClient.patch<unknown, Partial<TableReservationStatusUpdatePayload>>(
    `${getTableReservationDetailEndpoint(reservationId)}/status`,
    cleanParams({
      status: payload.status,
      restaurantId: payload.restaurantId,
      branchId: payload.branchId,
      customerId: payload.customerId,
    })
  );

  const reservation = normalizeTableReservationDetail(response);

  if (!reservation) {
    throw new Error("Invalid table reservation response");
  }

  return reservation;
}

/**
 * `POST /pos/orders/walk-in-reservations` creates a REQUESTED reservation for a walk-in guest.
 */
export async function createWalkInReservation(
  payload: WalkInReservationCreatePayload
): Promise<WalkInReservationCreateResult> {
  const response = await httpClient.post<unknown, Partial<WalkInReservationCreatePayload>>(
    WALK_IN_RESERVATIONS_ENDPOINT,
    cleanParams({
      branchId: payload.branchId,
      guestName: payload.guestName,
      guestPhone: payload.guestPhone,
      reservationDate: payload.reservationDate,
      guestCount: payload.guestCount,
      note: payload.note,
    })
  );

  const result = normalizeWalkInReservationResult(response);

  if (!result) {
    throw new Error("Invalid walk-in reservation response");
  }

  return result;
}
