"use client";

import { useCallback, useMemo, useState } from "react";

import Container from "@/components/common/Container";
import GiftCardDeleteDialog from "@/components/pages/Promotions/gift-cards/components/GiftCardDeleteDialog";
import GiftCardsFilters, {
  type GiftCardBranchOption,
  type GiftCardsFilterState,
} from "@/components/pages/Promotions/gift-cards/components/GiftCardsFilters";
import GiftCardsHeader from "@/components/pages/Promotions/gift-cards/components/GiftCardsHeader";
import GiftCardsPagination from "@/components/pages/Promotions/gift-cards/components/GiftCardsPagination";
import GiftCardsTable from "@/components/pages/Promotions/gift-cards/components/GiftCardsTable";
import { useAuth } from "@/hooks/useAuth";
import { useGetBranches } from "@/hooks/useBranches";
import { useDeleteGiftCard, useGiftCards } from "@/hooks/useGiftCards";
import type { GiftCard, GiftCardsListParams } from "@/types/gift-cards";

const defaultFilters: GiftCardsFilterState = {
  search: "",
  lifecycle: "ALL",
  branchId: "",
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const getBranchOptions = (payload: unknown): GiftCardBranchOption[] => {
  const source = isRecord(payload) ? payload.data : payload;
  if (!Array.isArray(source)) return [];

  return source.reduce<GiftCardBranchOption[]>((options, item) => {
    if (!isRecord(item) || typeof item.id !== "string") return options;

    options.push({
      id: item.id,
      name: typeof item.name === "string" && item.name ? item.name : item.id,
    });

    return options;
  }, []);
};

export default function GiftCardsPage() {
  const { user, restaurantId, branchId, isBranchAdmin } = useAuth();
  const [filters, setFilters] = useState(defaultFilters);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [giftCardToDelete, setGiftCardToDelete] = useState<GiftCard | null>(null);

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

  const params = useMemo<GiftCardsListParams>(
    () => ({
      page,
      limit,
      search: filters.search || undefined,
      restaurantId: restaurantId || undefined,
      branchId: scopedBranchId,
      lifecycle: filters.lifecycle !== "ALL" ? filters.lifecycle : undefined,
    }),
    [filters.lifecycle, filters.search, limit, page, restaurantId, scopedBranchId]
  );

  const giftCardsQuery = useGiftCards(params);
  const deleteMutation = useDeleteGiftCard();
  const giftCards = giftCardsQuery.data?.giftCards ?? [];
  const meta = giftCardsQuery.data?.meta ?? {
    page,
    limit,
    total: 0,
    totalPages: 1,
    hasNext: false,
    hasPrevious: false,
  };

  const handleFiltersChange = useCallback(
    (updatedFilters: Partial<GiftCardsFilterState>) => {
      setFilters((currentFilters) => ({
        ...currentFilters,
        ...updatedFilters,
      }));
      setPage(1);
    },
    []
  );

  const handleDelete = async () => {
    if (!giftCardToDelete) return;

    await deleteMutation.mutateAsync({
      id: giftCardToDelete.id,
      params: {
        restaurantId: restaurantId || undefined,
        branchId: giftCardToDelete.branch?.id || scopedBranchId,
      },
    });
    setGiftCardToDelete(null);
  };

  return (
    <Container>
      <GiftCardsHeader
        total={meta.total}
        isRefreshing={giftCardsQuery.isFetching}
        onRefresh={() => giftCardsQuery.refetch()}
      />

      <div className="mt-6 space-y-6 rounded-lg bg-white p-4 shadow-sm lg:p-6">
        <GiftCardsFilters
          filters={filters}
          branchOptions={branchOptions}
          isBranchAdmin={isBranchAdmin}
          branchName={user?.branchName ?? undefined}
          visibleCount={giftCards.length}
          totalCount={meta.total}
          isFetching={giftCardsQuery.isFetching}
          onFiltersChange={handleFiltersChange}
        />

        <GiftCardsTable
          giftCards={giftCards}
          loading={giftCardsQuery.isLoading}
          error={giftCardsQuery.error}
          onDelete={setGiftCardToDelete}
        />

        <GiftCardsPagination
          meta={meta}
          limit={limit}
          onLimitChange={(nextLimit) => {
            setLimit(nextLimit);
            setPage(1);
          }}
          onPageChange={setPage}
        />
      </div>

      <GiftCardDeleteDialog
        giftCard={giftCardToDelete}
        deleting={deleteMutation.isPending}
        onClose={() => setGiftCardToDelete(null)}
        onConfirm={handleDelete}
      />
    </Container>
  );
}
