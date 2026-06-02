"use client";

import { useCallback, useMemo, useState } from "react";

import Container from "@/components/common/Container";
import AdminDealDeleteDialog from "@/components/pages/Menu/deals/components/AdminDealDeleteDialog";
import AdminDealStatsModal from "@/components/pages/Menu/deals/components/AdminDealStatsModal";
import AdminDealsFilters, {
  type AdminDealBranchOption,
  type AdminDealsFilterState,
} from "@/components/pages/Menu/deals/components/AdminDealsFilters";
import AdminDealsHeader from "@/components/pages/Menu/deals/components/AdminDealsHeader";
import AdminDealsPagination from "@/components/pages/Menu/deals/components/AdminDealsPagination";
import AdminDealsTable from "@/components/pages/Menu/deals/components/AdminDealsTable";
import { useAdminDeals, useDeleteAdminDeal } from "@/hooks/useAdminDeals";
import { useAuth } from "@/hooks/useAuth";
import { useGetBranches } from "@/hooks/useBranches";
import type { AdminDeal, AdminDealsListParams } from "@/types/admin-deals";

const defaultFilters: AdminDealsFilterState = {
  search: "",
  lifecycle: "ALL",
  kind: "ALL",
  discountType: "ALL",
  branchId: "",
  includeInactive: false,
  withDeleted: false,
  sortBy: "createdAt",
  sortOrder: "DESC",
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const getBranchOptions = (payload: unknown): AdminDealBranchOption[] => {
  const source = isRecord(payload) ? payload.data : payload;
  if (!Array.isArray(source)) return [];

  return source.reduce<AdminDealBranchOption[]>((options, item) => {
    if (!isRecord(item) || typeof item.id !== "string") return options;

    options.push({
      id: item.id,
      name: typeof item.name === "string" && item.name ? item.name : item.id,
    });

    return options;
  }, []);
};

export default function AdminDealsPage() {
  const { user, restaurantId, branchId, isBranchAdmin, role } = useAuth();
  const [filters, setFilters] = useState(defaultFilters);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [dealToDelete, setDealToDelete] = useState<AdminDeal | null>(null);
  const [dealForStats, setDealForStats] = useState<AdminDeal | null>(null);

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

  const scopedBranchId = isBranchAdmin
    ? branchId || undefined
    : filters.branchId || undefined;
  const canViewDeleted = role === "SUPER_ADMIN";

  const params = useMemo<AdminDealsListParams>(
    () => ({
      page,
      limit,
      search: filters.search || undefined,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
      restaurantId: restaurantId || undefined,
      branchId: scopedBranchId,
      lifecycle: filters.lifecycle !== "ALL" ? filters.lifecycle : undefined,
      kind: filters.kind !== "ALL" ? filters.kind : undefined,
      discountType:
        filters.discountType !== "ALL" ? filters.discountType : undefined,
      includeInactive: filters.includeInactive || undefined,
      withDeleted: canViewDeleted && filters.withDeleted ? true : undefined,
    }),
    [
      canViewDeleted,
      filters.discountType,
      filters.includeInactive,
      filters.kind,
      filters.lifecycle,
      filters.search,
      filters.sortBy,
      filters.sortOrder,
      filters.withDeleted,
      limit,
      page,
      restaurantId,
      scopedBranchId,
    ]
  );

  const dealsQuery = useAdminDeals(params);
  const deleteMutation = useDeleteAdminDeal();
  const deals = dealsQuery.data?.deals ?? [];
  const meta = dealsQuery.data?.meta ?? {
    page,
    limit,
    total: 0,
    totalPages: 1,
    hasNext: false,
    hasPrevious: false,
  };

  const handleFiltersChange = useCallback(
    (updatedFilters: Partial<AdminDealsFilterState>) => {
      setFilters((currentFilters) => ({
        ...currentFilters,
        ...updatedFilters,
      }));
      setPage(1);
    },
    []
  );

  const handleDelete = async () => {
    if (!dealToDelete) return;

    await deleteMutation.mutateAsync({
      id: dealToDelete.id,
      params: {
        restaurantId: restaurantId || undefined,
        branchId: dealToDelete.branchId || scopedBranchId,
      },
    });
    setDealToDelete(null);
  };

  return (
    <Container>
      <AdminDealsHeader
        total={meta.total}
        isRefreshing={dealsQuery.isFetching}
        onRefresh={() => dealsQuery.refetch()}
      />

      <div className="mt-6 space-y-6 rounded-lg bg-white p-4 shadow-sm lg:p-6">
        <AdminDealsFilters
          filters={filters}
          branchOptions={branchOptions}
          isBranchAdmin={isBranchAdmin}
          branchName={user?.branchName ?? undefined}
          canViewDeleted={canViewDeleted}
          visibleCount={deals.length}
          totalCount={meta.total}
          isFetching={dealsQuery.isFetching}
          onFiltersChange={handleFiltersChange}
        />

        <AdminDealsTable
          deals={deals}
          loading={dealsQuery.isLoading}
          error={dealsQuery.error}
          onDelete={setDealToDelete}
          onStats={setDealForStats}
        />

        <AdminDealsPagination
          meta={meta}
          limit={limit}
          onLimitChange={(nextLimit) => {
            setLimit(nextLimit);
            setPage(1);
          }}
          onPageChange={setPage}
        />
      </div>

      <AdminDealDeleteDialog
        deal={dealToDelete}
        deleting={deleteMutation.isPending}
        onClose={() => setDealToDelete(null)}
        onConfirm={handleDelete}
      />

      <AdminDealStatsModal
        deal={dealForStats}
        restaurantId={restaurantId}
        branchId={dealForStats?.branchId || scopedBranchId}
        onClose={() => setDealForStats(null)}
      />
    </Container>
  );
}
