import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createTableReservation,
  getAdminTableReservations,
  type GetAdminReservationsParams,
  type CreateTableReservationPayload,
} from "@/services/reservations";

export const reservationQueryKeys = {
  all: ["reservations"] as const,
  adminList: (params?: GetAdminReservationsParams) =>
    [
      "reservations",
      "admin",
      params?.restaurantId,
      params?.branchId,
      params?.page,
      params?.limit,
      params?.search,
    ] as const,
};

export const useGetAdminTableReservations = (params?: GetAdminReservationsParams) => {
  return useQuery({
    queryKey: reservationQueryKeys.adminList(params),
    queryFn: () => getAdminTableReservations(params as GetAdminReservationsParams),
    enabled: Boolean(params?.restaurantId),
  });
};

export const useCreateTableReservation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      customerId,
      payload,
    }: {
      customerId: string;
      payload: CreateTableReservationPayload;
    }) => createTableReservation({ customerId, payload }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reservationQueryKeys.all });
    },
  });
};
