"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { getApiErrorMessage } from "@/lib/errors";
import {
  assignTableReservation,
  createWalkInReservation,
  getTableReservation,
  getTableReservations,
  updateTableReservationStatus,
} from "@/services/table-reservations";
import { searchWalkInCustomers } from "@/services/walk-in-customers";
import type {
  TableReservation,
  TableReservationAssignmentPayload,
  TableReservationScopeParams,
  TableReservationsParams,
  TableReservationsResponse,
  TableReservationStatusUpdatePayload,
  WalkInReservationCreatePayload,
} from "@/types/table-reservations";

export const tableReservationsQueryKeys = {
  all: ["table-reservations"] as const,
  lists: () => ["table-reservations", "list"] as const,
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
  detail: (reservationId: string) => ["table-reservations", "detail", reservationId] as const,
  walkInCustomers: (restaurantId: string | undefined, search: string) =>
    ["table-reservations", "walk-in-customers", restaurantId, search] as const,
};

export function useTableReservations(
  params: TableReservationsParams,
  options: { enabled?: boolean } = {}
) {
  return useQuery({
    queryKey: tableReservationsQueryKeys.list(params),
    queryFn: () => getTableReservations(params),
    placeholderData: (previousData) => previousData,
    enabled: options.enabled ?? true,
  });
}

/**
 * Finds a reservation inside any cached list page so the detail view can render
 * immediately after navigating from the list, and still has data to show if the
 * detail request itself fails.
 */
export const findCachedTableReservation = (
  cachedLists: Array<readonly [readonly unknown[], TableReservationsResponse | undefined]>,
  reservationId: string
): TableReservation | undefined => {
  for (const [, response] of cachedLists) {
    const match = response?.reservations.find((reservation) => reservation.id === reservationId);
    if (match) return match;
  }

  return undefined;
};

export function useTableReservation(
  reservationId: string | undefined,
  scope: TableReservationScopeParams = {}
) {
  const queryClient = useQueryClient();
  const id = reservationId ?? "";

  return useQuery({
    queryKey: tableReservationsQueryKeys.detail(id),
    queryFn: () => getTableReservation(id, scope),
    enabled: Boolean(id),
    initialData: () =>
      findCachedTableReservation(
        queryClient.getQueriesData<TableReservationsResponse>({
          queryKey: tableReservationsQueryKeys.lists(),
        }),
        id
      ),
    // Cached list rows are only a seed; always confirm against the detail endpoint.
    initialDataUpdatedAt: 0,
    retry: (failureCount, error) => {
      const status = (error as { response?: { status?: number } } | null)?.response?.status;
      if (status === 404 || status === 403) return false;
      return failureCount < 2;
    },
  });
}

export const useUpdateTableReservationStatus = () => {
  const queryClient = useQueryClient();
  const t = useTranslations("tableReservations");

  return useMutation({
    mutationFn: ({
      reservationId,
      payload,
    }: {
      reservationId: string;
      payload: TableReservationStatusUpdatePayload;
    }) => updateTableReservationStatus(reservationId, payload),
    onSuccess: (reservation) => {
      queryClient.setQueryData(tableReservationsQueryKeys.detail(reservation.id), reservation);
      queryClient.invalidateQueries({ queryKey: tableReservationsQueryKeys.all });
      toast.success(t("statusUpdated"));
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, t("statusUpdateFailed")));
    },
  });
};

/**
 * Persists the table label through the assignment endpoint. The reservation returned by
 * the API replaces the cached detail so every device sees the same assignment.
 */
export const useAssignTableReservation = () => {
  const queryClient = useQueryClient();
  const t = useTranslations("tableReservations");

  return useMutation({
    mutationFn: ({
      reservationId,
      payload,
    }: {
      reservationId: string;
      payload: TableReservationAssignmentPayload;
    }) => assignTableReservation(reservationId, payload),
    onSuccess: (reservation) => {
      queryClient.setQueryData(tableReservationsQueryKeys.detail(reservation.id), reservation);
      queryClient.invalidateQueries({ queryKey: tableReservationsQueryKeys.all });
      toast.success(t("tableSaved"));
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, t("tableAssignFailed")));
    },
  });
};

export const useCreateWalkInReservation = () => {
  const queryClient = useQueryClient();
  const t = useTranslations("tableReservations");

  return useMutation({
    mutationFn: (payload: WalkInReservationCreatePayload) => createWalkInReservation(payload),
    onSuccess: (reservation) => {
      queryClient.setQueryData(tableReservationsQueryKeys.detail(reservation.id), reservation);
      queryClient.invalidateQueries({ queryKey: tableReservationsQueryKeys.all });
      toast.success(t("walkInCreated"));
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, t("walkInCreateFailed")));
    },
  });
};

/** Customer lookup for the walk-in dialog; only runs while the dialog is open. */
export function useWalkInCustomerSearch(
  params: { restaurantId?: string; search: string },
  options: { enabled?: boolean } = {}
) {
  const search = params.search.trim();

  return useQuery({
    queryKey: tableReservationsQueryKeys.walkInCustomers(params.restaurantId, search),
    queryFn: () => searchWalkInCustomers({ restaurantId: params.restaurantId, search }),
    enabled: options.enabled ?? true,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}
