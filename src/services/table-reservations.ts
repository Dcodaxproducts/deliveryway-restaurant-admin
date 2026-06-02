import { httpClient } from "@/lib/axios";
import { cleanParams } from "@/lib/params";
import {
  normalizeTableReservationsResponse,
  type TableReservationsParams,
  type TableReservationsResponse,
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

