"use client";

import { useCallback, useMemo, useState } from "react";

import Container from "@/components/common/Container";
import TableReservationsFilters, {
  type TableReservationBranchOption,
  type TableReservationsFilterState,
} from "@/components/pages/TableReservations/components/TableReservationsFilters";
import TableReservationsHeader from "@/components/pages/TableReservations/components/TableReservationsHeader";
import TableReservationsPagination from "@/components/pages/TableReservations/components/TableReservationsPagination";
import TableReservationsStats from "@/components/pages/TableReservations/components/TableReservationsStats";
import TableReservationsTable from "@/components/pages/TableReservations/components/TableReservationsTable";
import { useAuth } from "@/hooks/useAuth";
import { useGetBranches } from "@/hooks/useBranches";
import { useTableReservations } from "@/hooks/useTableReservations";
import type { TableReservationsParams } from "@/types/table-reservations";

const defaultFilters: TableReservationsFilterState = {
  search: "",
  status: "ALL",
  sortBy: "reservationDate",
  sortOrder: "DESC",
  branchId: "",
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const getBranchOptions = (payload: unknown): TableReservationBranchOption[] => {
  const source = isRecord(payload) ? payload.data : payload;
  if (!Array.isArray(source)) return [];

  return source.reduce<TableReservationBranchOption[]>((options, item) => {
    if (!isRecord(item) || typeof item.id !== "string") return options;

    options.push({
      id: item.id,
      name: typeof item.name === "string" && item.name ? item.name : item.id,
    });

    return options;
  }, []);
};

export default function TableReservationsPage() {
  const { user, restaurantId, branchId, isBranchAdmin } = useAuth();
  const [filters, setFilters] = useState(defaultFilters);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const branchesQuery = useGetBranches(
    restaurantId
      ? {
          restaurantId,
          includeInactive: false,
          sortOrder: "ASC",
        }
      : undefined
  );

  const branchOptions = useMemo(
    () => getBranchOptions(branchesQuery.data),
    [branchesQuery.data]
  );

  const scopedBranchId = isBranchAdmin ? branchId || undefined : filters.branchId || undefined;

  const params = useMemo<TableReservationsParams>(
    () => ({
      page,
      limit,
      search: filters.search || undefined,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
      restaurantId: restaurantId || undefined,
      branchId: scopedBranchId,
      status: filters.status !== "ALL" ? filters.status : undefined,
    }),
    [
      filters.search,
      filters.sortBy,
      filters.sortOrder,
      filters.status,
      limit,
      page,
      restaurantId,
      scopedBranchId,
    ]
  );

  const reservationsQuery = useTableReservations(params);
  const reservations = reservationsQuery.data?.reservations ?? [];
  const meta = reservationsQuery.data?.meta ?? {
    page,
    limit,
    total: 0,
    totalPages: 1,
    hasNext: false,
    hasPrevious: false,
  };

  const handleFiltersChange = useCallback(
    (updatedFilters: Partial<TableReservationsFilterState>) => {
      setFilters((currentFilters) => ({
        ...currentFilters,
        ...updatedFilters,
      }));
      setPage(1);
    },
    []
  );

  const handleLimitChange = (nextLimit: number) => {
    setLimit(nextLimit);
    setPage(1);
  };

  return (
    <Container>
      <TableReservationsHeader
        total={meta.total}
        isRefreshing={reservationsQuery.isFetching}
        onRefresh={() => reservationsQuery.refetch()}
      />

      <div className="space-y-6 rounded-lg bg-white p-4 shadow-sm lg:p-6">
        <TableReservationsStats
          reservations={reservations}
          total={meta.total}
          loading={reservationsQuery.isLoading || reservationsQuery.isFetching}
        />

        <TableReservationsFilters
          filters={filters}
          branchOptions={branchOptions}
          isBranchAdmin={isBranchAdmin}
          branchName={user?.branchName ?? undefined}
          visibleCount={reservations.length}
          totalCount={meta.total}
          isFetching={reservationsQuery.isFetching}
          onFiltersChange={handleFiltersChange}
        />

        <TableReservationsTable
          reservations={reservations}
          loading={reservationsQuery.isLoading}
          error={reservationsQuery.error}
        />

        <TableReservationsPagination
          meta={meta}
          limit={limit}
          onLimitChange={handleLimitChange}
          onPageChange={setPage}
        />
      </div>
    </Container>
  );
}
