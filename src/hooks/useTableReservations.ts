"use client";

import { useQuery } from "@tanstack/react-query";

import { getTableReservations } from "@/services/table-reservations";
import type { TableReservationsParams } from "@/types/table-reservations";

export const tableReservationsQueryKeys = {
  list: (params: TableReservationsParams) =>
    [
      "table-reservations",
      "list",
      params.page,
      params.limit,
      params.search,
      params.sortBy,
      params.sortOrder,
      params.restaurantId,
      params.branchId,
      params.customerId,
      params.status,
    ] as const,
};

export function useTableReservations(params: TableReservationsParams) {
  return useQuery({
    queryKey: tableReservationsQueryKeys.list(params),
    queryFn: () => getTableReservations(params),
    placeholderData: (previousData) => previousData,
  });
}

