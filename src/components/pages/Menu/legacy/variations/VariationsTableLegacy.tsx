"use client";

import { FormSelect } from "@/components/ui/form-select";

import { useEffect, useMemo, useState } from "react";
import { FaPen, FaTrash } from "react-icons/fa";
import {
  Filter,
  Loader2,
  PlusCircle,
  RefreshCcw,
  Search,
  SlidersHorizontal,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import PaginationSection from "@/components/common/PaginationSection";
import { ResponsiveDataView } from "@/components/common/ResponsiveDataView";
import { SegmentedControl } from "@/components/common/SegmentedControl";
import { StatePanel } from "@/components/common/EmptyState";
import { StatusBadge } from "@/components/common/status-badge";
import { MenuManagementActions } from "@/components/pages/Menu/shared/MenuManagementPage";
import DeleteDialog from "@/components/common/dialogs/delete-dialog";

import { useDeleteMenuVariation, useGetMenuVariations } from "@/hooks/useMenus";

import VariationModal from "@/components/pages/Menu/legacy/root-menu-components/listing/VariationModal";
import { useAuth } from "@/hooks/useAuth";
import { extractResponseItems, extractResponseMeta } from "@/lib/response";
import { formatMoney } from "@/lib/currency";
import { useTranslations } from "next-intl";

const PAGE_LIMIT = 10;

type SortOrder = "ASC" | "DESC";
type SortBy = "createdAt" | "name" | "price" | "sortOrder";
type VariationStatusFilter = "active" | "inactive" | "all";
type VariationRow = {
  id: string;
  name?: string;
  description?: string;
  price?: string | number | null;
  isDefault?: boolean;
  isActive?: boolean;
};

const STATUS_FILTER_OPTIONS: Array<{
  value: VariationStatusFilter;
}> = [
  {
    value: "active",
  },
  {
    value: "inactive",
  },
  {
    value: "all",
  },
];

const SORT_OPTIONS: Array<{
  label: string;
  value: SortBy;
}> = [
  {
    label: "Latest",
    value: "createdAt",
  },
  {
    label: "Name",
    value: "name",
  },
  {
    label: "Price",
    value: "price",
  },
];

const formatPrice = (value: any) => {
  const numeric = Number(value ?? 0);

  if (Number.isNaN(numeric)) return "0.00";

  return numeric.toFixed(2);
};

const formatCurrency = (value: any) => {
  return formatMoney(formatPrice(value));
};

export default function VariationsTable() {
  const t = useTranslations("menu.variationsTable");
  const commonT = useTranslations("common");
  const { restaurantId } = useAuth();

  const [page, setPage] = useState(1);
  const [limit] = useState(PAGE_LIMIT);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [sortBy, setSortBy] = useState<SortBy>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("DESC");
  const [statusFilter, setStatusFilter] =
    useState<VariationStatusFilter>("active");

  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);

  const [deleteId, setDeleteId] = useState<string | null>(null);

  const canFetchVariations = Boolean(restaurantId);

  const activeStatusOption = useMemo(() => {
    return (
      STATUS_FILTER_OPTIONS.find((option) => option.value === statusFilter) ||
      STATUS_FILTER_OPTIONS[0]
    );
  }, [statusFilter]);
  const getStatusLabel = (value: VariationStatusFilter) => {
    if (value === "active") return commonT("active");
    if (value === "inactive") return commonT("inactive");
    return t("all");
  };
  const getStatusHelper = (value: VariationStatusFilter) => {
    if (value === "active") return t("onlyActive");
    if (value === "inactive") return t("onlyInactive");
    return t("activeAndInactive");
  };
  const getSortLabel = (value: SortBy) => {
    if (value === "createdAt") return t("latest");
    if (value === "name") return commonT("name");
    if (value === "price") return commonT("price");
    return t("sort");
  };

  const hasActiveFilters = useMemo(() => {
    return Boolean(
      search.trim() ||
      debouncedSearch ||
      statusFilter !== "active" ||
      sortBy !== "createdAt" ||
      sortOrder !== "DESC",
    );
  }, [search, debouncedSearch, statusFilter, sortBy, sortOrder]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  const queryParams = useMemo(() => {
    const params: any = {
      page,
      limit,
      restaurantId: restaurantId || undefined,
      search: debouncedSearch || undefined,
      sortBy,
      sortOrder,
    };

    if (statusFilter === "active") {
      params.isActive = true;
    }

    if (statusFilter === "inactive") {
      params.inactive = true;
    }

    if (statusFilter === "all") {
      params.all = true;
      params.includeInactive = true;
    }

    return params;
  }, [
    page,
    limit,
    restaurantId,
    debouncedSearch,
    sortBy,
    sortOrder,
    statusFilter,
  ]);

  const {
    data: response,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useGetMenuVariations(queryParams);

  const { mutate: deleteVariation, isPending: isDeleting } =
    useDeleteMenuVariation();

  const items = useMemo(() => {
    return extractResponseItems<VariationRow>(response);
  }, [response]);

  const meta = useMemo(() => {
    return extractResponseMeta(response);
  }, [response]);

  const pagination = useMemo(() => {
    const total = Number(meta?.total ?? items.length ?? 0);
    const currentPage = Number(meta?.page ?? page);
    const pageSize = Number(meta?.limit ?? limit);

    const totalPages = Number(
      meta?.totalPages ??
        meta?.pages ??
        (total > 0 && pageSize > 0 ? Math.ceil(total / pageSize) : 1),
    );

    return {
      page: currentPage,
      totalPages: totalPages || 1,
      total,
      limit: pageSize || limit,
      hasNext:
        typeof meta?.hasNext === "boolean"
          ? meta.hasNext
          : currentPage < (totalPages || 1),
      hasPrevious:
        typeof meta?.hasPrevious === "boolean"
          ? meta.hasPrevious
          : typeof meta?.hasPrev === "boolean"
            ? meta.hasPrev
            : currentPage > 1,
    };
  }, [meta, items.length, page, limit]);

  const shouldShowInitialLoader = isLoading && items.length === 0;
  const shouldShowRefreshing = isFetching && !shouldShowInitialLoader;
  const shouldShowEmpty = !isLoading && !isFetching && items.length === 0;

  const handleDelete = () => {
    if (!deleteId) return;

    deleteVariation(deleteId, {
      onSuccess: () => {
        setDeleteId(null);
        refetch();
      },
    });
  };

  const openCreateModal = () => {
    setSelected(null);
    setOpen(true);
  };

  const openEditModal = (variation: any) => {
    setSelected(variation);
    setOpen(true);
  };

  const handleManualSearch = () => {
    if (!canFetchVariations) return;

    const nextSearch = search.trim();

    setPage(1);
    setDebouncedSearch(nextSearch);

    if (page === 1 && debouncedSearch === nextSearch) {
      refetch();
    }
  };

  const handleStatusChange = (value: VariationStatusFilter) => {
    setStatusFilter(value);
    setPage(1);
  };

  const handleSortByChange = (value: SortBy) => {
    setSortBy(value);
    setPage(1);
  };

  const handleSortOrderChange = (value: SortOrder) => {
    setSortOrder(value);
    setPage(1);
  };

  const handleResetFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setStatusFilter("active");
    setSortBy("createdAt");
    setSortOrder("DESC");
    setPage(1);

    if (!hasActiveFilters) {
      refetch();
    }
  };

  const EmptyState = () => (
    <StatePanel
      title={t("emptyTitle")}
      description={
        hasActiveFilters ? t("emptyFiltered") : t("emptyDescription")
      }
      icon={<SlidersHorizontal size={22} />}
      action={
        hasActiveFilters ? (
          <Button
            type="button"
            variant="outline"
            onClick={handleResetFilters}
            className="mt-4 rounded-[12px]"
          >
            <RefreshCcw size={16} className="mr-2" />
            {t("resetFilters")}
          </Button>
        ) : (
          <Button
            type="button"
            onClick={openCreateModal}
            className="mt-4 rounded-[12px] bg-primary text-white hover:bg-primary/90"
          >
            <PlusCircle size={18} className="mr-2" />
            {t("add")}
          </Button>
        )
      }
    />
  );

  return (
    <div className="w-full max-w-full overflow-hidden">
      <MenuManagementActions>
        <Button
          type="button"
          onClick={openCreateModal}
          className="h-[42px] shrink-0 rounded-[12px] bg-primary px-4 text-white hover:bg-primary/90"
        >
          <PlusCircle size={18} className="mr-2" />
          {t("add")}
        </Button>
      </MenuManagementActions>

      {/* FILTERS */}
      <div className="mb-6 w-full max-w-full overflow-hidden rounded-[20px] border border-gray-100 bg-white p-4 shadow-sm">
        <div className="mb-4 flex min-w-0 flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-primary/10 text-primary">
              <Filter size={18} />
            </div>

            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-gray-900">
                {t("filtersTitle")}
              </h3>
              <p className="mt-1 text-xs text-gray-500">
                {t("filtersDescription")}{" "}
                <span className="font-medium text-gray-700">
                  {getStatusHelper(activeStatusOption.value)}
                </span>
              </p>
            </div>
          </div>

          {shouldShowRefreshing ? (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
              <Loader2 size={12} className="animate-spin" />
              {commonT("refreshing")}
            </span>
          ) : null}
        </div>

        <div className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-12 xl:items-end">
          <div className="min-w-0 xl:col-span-4">
            <label className="mb-1.5 block text-xs font-medium text-gray-600">
              {commonT("search")}
            </label>

            <div className="relative min-w-0">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />

              <input
                placeholder={t("searchPlaceholder")}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    handleManualSearch();
                  }
                }}
                className="h-[44px] w-full min-w-0 rounded-[14px] border border-gray-200 bg-[#FAFAFA] pl-11 pr-4 text-sm text-gray-800 outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
              />
            </div>
          </div>

          {/* STATUS */}
          <div className="min-w-0 xl:col-span-3">
            <label className="mb-1.5 block text-xs font-medium text-gray-600">
              {commonT("status")}
            </label>

            <SegmentedControl
              value={statusFilter}
              options={STATUS_FILTER_OPTIONS.map((option) => ({
                value: option.value,
                label: getStatusLabel(option.value),
              }))}
              onValueChange={handleStatusChange}
              ariaLabel={commonT("status")}
              disabled={!canFetchVariations}
              size="default"
            />
          </div>

          {/* SORT BY */}
          <div className="min-w-0 xl:col-span-2">
            <label className="mb-1.5 block text-xs font-medium text-gray-600">
              {commonT("sortBy")}
            </label>

            <FormSelect
              value={sortBy}
              onChange={(event) =>
                handleSortByChange(event.target.value as SortBy)
              }
              disabled={!canFetchVariations}
              className="h-[44px] w-full min-w-0 rounded-[14px] border border-gray-200 bg-[#FAFAFA] px-4 text-sm text-gray-700 outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {getSortLabel(option.value)}
                </option>
              ))}
            </FormSelect>
          </div>

          {/* SORT ORDER */}
          <div className="min-w-0 xl:col-span-1">
            <label className="mb-1.5 block text-xs font-medium text-gray-600">
              {commonT("order")}
            </label>

            <FormSelect
              value={sortOrder}
              onChange={(event) =>
                handleSortOrderChange(event.target.value as SortOrder)
              }
              disabled={!canFetchVariations}
              className="h-[44px] w-full min-w-0 rounded-[14px] border border-gray-200 bg-[#FAFAFA] px-3 text-sm text-gray-700 outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="DESC">DESC</option>
              <option value="ASC">ASC</option>
            </FormSelect>
          </div>

          <Button
            disabled={!canFetchVariations}
            onClick={handleManualSearch}
            className="h-[44px] rounded-[14px] bg-primary px-5 text-white shadow-sm hover:bg-primary/90 md:w-full xl:col-span-1"
          >
            {commonT("search")}
          </Button>

          <Button
            type="button"
            variant="outline"
            disabled={!canFetchVariations || (!hasActiveFilters && !isFetching)}
            onClick={handleResetFilters}
            className="h-[44px] rounded-[14px] border-gray-200 px-4 text-gray-700 md:w-full xl:col-span-1"
          >
            <RefreshCcw size={15} className="mr-2" />
            {commonT("reset")}
          </Button>
        </div>
      </div>

      {!canFetchVariations ? (
        <StatePanel
          state="permission"
          title={t("missingRestaurantContext")}
          description=""
          compact
          className="mb-6"
        />
      ) : null}

      {isError ? (
        <StatePanel
          state="error"
          title={commonT("unableToLoad")}
          description=""
          compact
          className="mb-4"
          action={
            <Button
              variant="outline"
              disabled={isFetching}
              onClick={() => void refetch()}
            >
              {commonT("refresh")}
            </Button>
          }
        />
      ) : null}
      {isError && items.length === 0 ? null : shouldShowEmpty ? (
        <EmptyState />
      ) : (
        <ResponsiveDataView
          data={items}
          rowKey={(item) => item.id}
          loading={
            shouldShowInitialLoader || (isFetching && items.length === 0)
          }
          emptyTitle={t("emptyTitle")}
          columns={[
            {
              id: "variation",
              header: t("variation"),
              cell: (item) => (
                <div className="min-w-0">
                  <p className="truncate font-semibold text-gray-900">
                    {item?.name || "-"}
                  </p>

                  <p className="mt-0.5 truncate text-xs text-gray-400">
                    ID: {item?.id || "-"}
                  </p>
                </div>
              ),
            },
            {
              id: "description",
              header: commonT("description"),
              cell: (item) => (
                <p className="line-clamp-2 break-words text-gray-600">
                  {item?.description || commonT("noData")}
                </p>
              ),
            },
            {
              id: "price",
              header: commonT("price"),
              align: "center",
              cell: (item) => (
                <span className="block truncate">
                  {formatCurrency(item?.price)}
                </span>
              ),
            },
            {
              id: "default",
              header: t("default"),
              align: "center",
              cell: (item) => (
                <StatusBadge tone={item?.isDefault ? "info" : "neutral"}>
                  <span className="truncate">
                    {item?.isDefault ? t("default") : commonT("no")}
                  </span>
                </StatusBadge>
              ),
            },
            {
              id: "status",
              header: commonT("status"),
              align: "center",
              cell: (item) => (
                <StatusBadge tone={item?.isActive ? "success" : "neutral"}>
                  <span className="truncate">
                    {item?.isActive ? commonT("active") : commonT("inactive")}
                  </span>
                </StatusBadge>
              ),
            },
            {
              id: "actions",
              header: commonT("actions"),
              align: "center",
              cell: (item) => (
                <div className="flex min-w-[88px] items-center justify-center gap-2">
                  <button
                    type="button"
                    title={commonT("edit")}
                    onClick={() => openEditModal(item)}
                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm transition-all duration-200 hover:-translate-y-[1px] hover:border-primary/20 hover:text-primary"
                    aria-label={t("editAria")}
                  >
                    <FaPen size={13} />
                  </button>

                  <button
                    type="button"
                    title={commonT("delete")}
                    onClick={() => setDeleteId(item.id)}
                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm transition-all duration-200 hover:-translate-y-[1px] hover:border-red-200 hover:text-red-500"
                    aria-label={t("deleteAria")}
                  >
                    <FaTrash size={13} />
                  </button>
                </div>
              ),
            },
          ]}
          renderMobileItem={(item) => (
            <div
              key={item.id}
              className="w-full max-w-full overflow-hidden rounded-[18px] border border-gray-100 bg-white p-4 shadow-sm"
            >
              <div className="flex min-w-0 items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-[16px] font-semibold text-gray-900">
                    {item?.name || "-"}
                  </h3>

                  <p className="mt-1 line-clamp-2 break-words text-sm text-gray-500">
                    {item?.description || commonT("noData")}
                  </p>
                </div>

                <StatusBadge tone={item?.isActive ? "success" : "neutral"}>
                  {item?.isActive ? commonT("active") : commonT("inactive")}
                </StatusBadge>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="min-w-0 rounded-[12px] bg-[#FAFAFA] p-3">
                  <p className="text-xs text-gray-400">{commonT("price")}</p>
                  <p className="truncate text-sm font-semibold text-gray-900">
                    {formatCurrency(item?.price)}
                  </p>
                </div>

                <div className="min-w-0 rounded-[12px] bg-[#FAFAFA] p-3">
                  <p className="text-xs text-gray-400">{t("default")}</p>
                  <p className="truncate text-sm font-semibold text-gray-900">
                    {item?.isDefault ? commonT("yes") : commonT("no")}
                  </p>
                </div>

                <div className="min-w-0 rounded-[12px] bg-[#FAFAFA] p-3">
                  <p className="text-xs text-gray-400">{t("id")}</p>
                  <p className="truncate text-sm font-semibold text-gray-900">
                    {item?.id || "-"}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => openEditModal(item)}
                  className="inline-flex items-center gap-2 rounded-[10px] border border-gray-200 px-3 py-2 text-sm text-gray-700 transition hover:border-primary hover:text-primary"
                >
                  <FaPen size={13} />
                  {commonT("edit")}
                </button>

                <button
                  type="button"
                  onClick={() => setDeleteId(item.id)}
                  className="inline-flex items-center gap-2 rounded-[10px] border border-gray-200 px-3 py-2 text-sm text-gray-700 transition hover:border-red-300 hover:text-red-500"
                >
                  <FaTrash size={13} />
                  {commonT("delete")}
                </button>
              </div>
            </div>
          )}
        />
      )}
      <PaginationSection {...pagination} onPageChange={setPage} />

      <VariationModal
        open={open}
        onOpenChange={(value) => {
          setOpen(value);

          if (!value) {
            setSelected(null);
          }
        }}
        initialData={selected}
        onSuccess={() => {
          setPage(1);
          refetch();
        }}
      />

      <DeleteDialog
        open={!!deleteId}
        onOpenChange={(value) => {
          if (!value) {
            setDeleteId(null);
          }
        }}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        title={t("deleteTitle")}
        description={t("deleteDescription")}
      />
    </div>
  );
}
