"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import Container from "@/components/common/Container";
import { SectionCard } from "@/components/common/SectionCard";
import TableReservationsFilters, {
  type TableReservationBranchOption,
  type TableReservationsFilterState,
} from "@/components/pages/TableReservations/components/TableReservationsFilters";
import TableReservationsHeader from "@/components/pages/TableReservations/components/TableReservationsHeader";
import TableReservationsPagination from "@/components/pages/TableReservations/components/TableReservationsPagination";
import TableReservationsStats from "@/components/pages/TableReservations/components/TableReservationsStats";
import { TableReservationsTable } from "@/components/pages/TableReservations/components/TableReservationsTable";
import { WalkInQueuePanel } from "@/components/pages/TableReservations/components/WalkInQueuePanel";
import {
  buildTableReservationsQueryString,
  parseTableReservationsLimit,
  parseTableReservationsListState,
  preserveTableReservationsListQuery,
  TABLE_RESERVATIONS_ROUTE,
} from "@/components/pages/TableReservations/utils/table-reservations-query";
import { useAuth } from "@/hooks/useAuth";
import { useGetBranches } from "@/hooks/useBranches";
import { useTableReservations } from "@/hooks/useTableReservations";
import type { TableReservationsParams } from "@/types/table-reservations";

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

export function TableReservationsPage() {
  const { user, restaurantId, branchId, isBranchAdmin, isPosPrinter } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isBranchScoped = isBranchAdmin || isPosPrinter;
  // The URL is the source of truth on first render so page/limit/filters survive
  // detail navigation, reloads, and shared links.
  const [initialState] = useState(() => {
    const state = parseTableReservationsListState(searchParams);
    // Branch-scoped accounts always see their own branch; a URL branch filter is meaningless.
    return isBranchScoped ? { ...state, filters: { ...state.filters, branchId: "" } } : state;
  });
  const [filters, setFilters] = useState(initialState.filters);
  const [page, setPage] = useState(initialState.page);
  const [limit, setLimit] = useState(initialState.limit);

  const branchesQuery = useGetBranches(
    restaurantId
      ? {
          restaurantId,
          includeInactive: false,
          sortOrder: "ASC",
        }
      : undefined,
    { enabled: !isPosPrinter },
  );

  const branchOptions = useMemo(
    () => getBranchOptions(branchesQuery.data),
    [branchesQuery.data]
  );

  const scopedBranchId = isBranchScoped
    ? branchId || undefined
    : filters.branchId || undefined;

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

  const listQuery = useMemo(
    () => buildTableReservationsQueryString({ filters, page, limit }),
    [filters, limit, page]
  );

  useEffect(() => {
    if (preserveTableReservationsListQuery(searchParams) === listQuery) return;
    router.replace(`${TABLE_RESERVATIONS_ROUTE}${listQuery}`, { scroll: false });
  }, [listQuery, router, searchParams]);

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

  // A stale deep link can point past the last page; snap back to the last real page.
  useEffect(() => {
    const currentMeta = reservationsQuery.data?.meta;
    if (!currentMeta || reservationsQuery.isPlaceholderData) return;
    if (currentMeta.total > 0 && page > currentMeta.totalPages) {
      setPage(Math.max(currentMeta.totalPages, 1));
    }
  }, [page, reservationsQuery.data, reservationsQuery.isPlaceholderData]);

  const handleFiltersChange = useCallback(
    (updatedFilters: Partial<TableReservationsFilterState>) => {
      setFilters((currentFilters) => {
        const nextFilters = { ...currentFilters, ...updatedFilters };
        const changed = (Object.keys(updatedFilters) as Array<keyof TableReservationsFilterState>).some(
          (key) => currentFilters[key] !== nextFilters[key]
        );
        if (changed) setPage(1);
        return changed ? nextFilters : currentFilters;
      });
    },
    []
  );

  const handleLimitChange = (nextLimit: number) => {
    const supportedLimit = parseTableReservationsLimit(nextLimit);
    if (supportedLimit === limit) return;
    setLimit(supportedLimit);
    setPage(1);
  };

  return (
    <Container>
      <TableReservationsHeader
        total={meta.total}
        isRefreshing={reservationsQuery.isFetching}
        onRefresh={() => reservationsQuery.refetch()}
      />

      <WalkInQueuePanel
        restaurantId={restaurantId || undefined}
        branchId={scopedBranchId}
        isBranchScoped={isBranchScoped}
        branchName={user?.branchName ?? undefined}
        branchOptions={branchOptions}
        canCreate={!isPosPrinter}
        listQuery={listQuery}
      />

      <SectionCard padding="md" className="space-y-6">
        <TableReservationsStats
          reservations={reservations}
          total={meta.total}
          loading={reservationsQuery.isLoading || reservationsQuery.isFetching}
        />

        <TableReservationsFilters
          filters={filters}
          branchOptions={branchOptions}
          isBranchAdmin={isBranchScoped}
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
          restaurantId={restaurantId || undefined}
          branchId={branchId || undefined}
          listQuery={listQuery}
        />

        <TableReservationsPagination
          meta={meta}
          limit={limit}
          onLimitChange={handleLimitChange}
          onPageChange={setPage}
        />
      </SectionCard>
    </Container>
  );
}
