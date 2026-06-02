import { httpClient } from "@/lib/axios";
import { cleanParams } from "@/lib/params";
import {
  normalizeTableReservation,
  normalizeTableReservationsResponse,
  type TableReservation,
  type TableReservationsParams,
  type TableReservationsResponse,
  type TableReservationStatusUpdatePayload,
} from "@/types/table-reservations";

export const TABLE_RESERVATIONS_ENDPOINT = "/customer-app/admin/table-reservations";

export async function getTableReservations(
  params: TableReservationsParams
): Promise<TableReservationsResponse> {
  const response = await httpClient.get<unknown>(TABLE_RESERVATIONS_ENDPOINT, {
    params: cleanParams(params),
  });

  return normalizeTableReservationsResponse(response, params);
}

export async function updateTableReservationStatus(
  reservationId: string,
  payload: TableReservationStatusUpdatePayload
): Promise<TableReservation> {
  const response = await httpClient.patch<unknown, Partial<TableReservationStatusUpdatePayload>>(
    `${TABLE_RESERVATIONS_ENDPOINT}/${reservationId}/status`,
    cleanParams({
      status: payload.status,
      restaurantId: payload.restaurantId,
      branchId: payload.branchId,
      customerId: payload.customerId,
    })
  );

  const source =
    typeof response === "object" &&
    response !== null &&
    !Array.isArray(response) &&
    "data" in response
      ? response.data
      : response;
  const reservation = normalizeTableReservation(source);

  if (!reservation) {
    throw new Error("Invalid table reservation response");
  }

  return reservation;
}
