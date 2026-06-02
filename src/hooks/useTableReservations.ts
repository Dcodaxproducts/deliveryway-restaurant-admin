"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { getApiErrorMessage } from "@/lib/errors";
import {
  getTableReservations,
  updateTableReservationStatus,
} from "@/services/table-reservations";
import type {
  TableReservationsParams,
  TableReservationStatusUpdatePayload,
} from "@/types/table-reservations";

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

export const useUpdateTableReservationStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      reservationId,
      payload,
    }: {
      reservationId: string;
      payload: TableReservationStatusUpdatePayload;
    }) => updateTableReservationStatus(reservationId, payload),
    onSuccess: (reservation) => {
      queryClient.invalidateQueries({ queryKey: ["table-reservations"] });
      queryClient.invalidateQueries({
        queryKey: ["table-reservations", "detail", reservation.id],
      });
      toast.success("Reservation status updated");
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Unable to update reservation status"));
    },
  });
};
