"use client";

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
import PaginationSection from "@/components/common/pagination";
import DeleteDialog from "@/components/common/dialogs/delete-dialog";

import {
  useDeleteMenuVariation,
  useGetMenuVariations,
} from "@/hooks/useMenus";

import VariationModal from "@/components/pages/Menu/legacy/root-menu-components/listing/VariationModal";
import { useAuth } from "@/hooks/useAuth";
import { extractResponseItems, extractResponseMeta } from "@/lib/response";
import { useTranslations } from "next-intl";

const PAGE_LIMIT = 10;

type SortOrder = "ASC" | "DESC";
type SortBy = "createdAt" | "name" | "price" | "sortOrder";
type VariationStatusFilter = "active" | "inactive" | "all";

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
  return `$${formatPrice(value)}`;
};

export default function VariationsTable() {
  const t = useTranslations("menu.variationsTable");
  const commonT = useTranslations("common");
  const { user, restaurantId: authRestaurantId } = useAuth();

  const restaurantId =
    authRestaurantId ?? user?.restaurantId ?? user?.tenantId ?? "";

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
        sortOrder !== "DESC"
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
    refetch,
  } = useGetMenuVariations(queryParams);

  const { mutate: deleteVariation, isPending: isDeleting } =
    useDeleteMenuVariation();

  const items = useMemo(() => {
    return extractResponseItems(response);
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
        (total > 0 && pageSize > 0 ? Math.ceil(total / pageSize) : 1)
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

  const SkeletonRow = () => (
    <tr>
      <td colSpan={6} className="px-5 py-5">
        <div className="grid animate-pulse grid-cols-[24%_24%_13%_13%_13%_13%] gap-3">
          <div className="h-4 rounded bg-gray-200" />
          <div className="h-4 rounded bg-gray-200" />
          <div className="h-4 rounded bg-gray-200" />
          <div className="h-4 rounded bg-gray-200" />
          <div className="h-4 rounded bg-gray-200" />
          <div className="h-4 rounded bg-gray-200" />
        </div>
      </td>
    </tr>
  );

  const SkeletonCard = () => (
    <div className="animate-pulse rounded-[18px] border border-gray-100 bg-white p-4 shadow-sm">
      <div className="space-y-3">
        <div className="h-4 w-[160px] max-w-full rounded bg-gray-200" />
        <div className="h-3 w-full rounded bg-gray-200" />
        <div className="h-3 w-[120px] max-w-full rounded bg-gray-200" />
      </div>
    </div>
  );

  const EmptyState = () => (
    <div className="mx-auto max-w-[360px] px-4 py-10 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 text-gray-500">
        <SlidersHorizontal size={22} />
      </div>

      <p className="text-base font-semibold text-gray-900">
        {t("emptyTitle")}
      </p>

      <p className="mt-1 text-sm leading-6 text-gray-500">
        {hasActiveFilters
          ? t("emptyFiltered")
          : t("emptyDescription")}
      </p>

      {hasActiveFilters ? (
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
      )}
    </div>
  );

  return (
    <div className="w-full max-w-full overflow-hidden">
      {/* PAGE HEADER */}
      <div className="mb-5 flex min-w-0 flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <h2 className="text-[20px] font-semibold text-gray-900">
            {t("title")}
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            {t("description")}
          </p>
        </div>

        <Button
          type="button"
          onClick={openCreateModal}
          className="h-[42px] shrink-0 rounded-[12px] bg-primary px-4 text-white hover:bg-primary/90"
        >
          <PlusCircle size={18} className="mr-2" />
          {t("add")}
        </Button>
      </div>

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

          <div className="flex shrink-0 flex-wrap items-center gap-2 text-xs text-gray-500">
            <span className="rounded-full bg-gray-100 px-2.5 py-1 font-medium text-gray-600">
              {t("showingCount", { shown: items.length, total: pagination.total })}
            </span>

            {shouldShowRefreshing ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 font-medium text-primary">
                <Loader2 size={12} className="animate-spin" />
                {commonT("refreshing")}
              </span>
            ) : null}
          </div>
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

            <div className="grid min-w-0 grid-cols-3 gap-2 rounded-[14px] bg-[#F7F7F7] p-1">
              {STATUS_FILTER_OPTIONS.map((option) => {
                const isActive = statusFilter === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleStatusChange(option.value)}
                    disabled={!canFetchVariations}
                    className={`h-[38px] min-w-0 rounded-[11px] px-2 text-xs font-semibold transition ${
                      isActive
                        ? "bg-white text-primary shadow-sm ring-1 ring-primary/10"
                        : "text-gray-500 hover:bg-white/70 hover:text-gray-800"
                    } disabled:cursor-not-allowed disabled:opacity-60`}
                  >
                    <span className="block truncate">{getStatusLabel(option.value)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SORT BY */}
          <div className="min-w-0 xl:col-span-2">
            <label className="mb-1.5 block text-xs font-medium text-gray-600">
              {commonT("sortBy")}
            </label>

            <select
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
            </select>
          </div>

          {/* SORT ORDER */}
          <div className="min-w-0 xl:col-span-1">
            <label className="mb-1.5 block text-xs font-medium text-gray-600">
              {commonT("order")}
            </label>

            <select
              value={sortOrder}
              onChange={(event) =>
                handleSortOrderChange(event.target.value as SortOrder)
              }
              disabled={!canFetchVariations}
              className="h-[44px] w-full min-w-0 rounded-[14px] border border-gray-200 bg-[#FAFAFA] px-3 text-sm text-gray-700 outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="DESC">DESC</option>
              <option value="ASC">ASC</option>
            </select>
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
        <div className="rounded-[18px] border border-amber-100 bg-amber-50 p-4 text-sm text-amber-700">
          {t("missingRestaurantContext")}
        </div>
      ) : null}

      <div className="hidden w-full max-w-full overflow-hidden rounded-[18px] border border-gray-100 bg-white shadow-sm md:block">
        <table className="w-full table-fixed text-sm">
          <thead>
            <tr className="border-b bg-[#FAFAFA] text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              <th className="w-[24%] px-5 py-4">{t("variation")}</th>
              <th className="w-[24%] px-3 py-4">{commonT("description")}</th>
              <th className="w-[13%] px-3 py-4 text-center">{commonT("price")}</th>
              <th className="w-[13%] px-3 py-4 text-center">{t("default")}</th>
              <th className="w-[13%] px-3 py-4 text-center">{commonT("status")}</th>
              <th className="w-[13%] px-5 py-4 text-center">{commonT("actions")}</th>
            </tr>
          </thead>

          <tbody>
            {shouldShowInitialLoader ? (
              Array.from({ length: 6 }).map((_, index) => (
                <SkeletonRow key={index} />
              ))
            ) : shouldShowEmpty ? (
              <tr>
                <td colSpan={6}>
                  <EmptyState />
                </td>
              </tr>
            ) : (
              items.map((item: any) => (
                <tr
                  key={item.id}
                  className="border-b border-gray-100 transition hover:bg-[#FAFAFA]"
                >
                  <td className="px-5 py-4">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-gray-900">
                        {item?.name || "-"}
                      </p>

                      <p className="mt-0.5 truncate text-xs text-gray-400">
                        ID: {item?.id || "-"}
                      </p>
                    </div>
                  </td>

                  <td className="px-3 py-4 align-middle">
                    <p className="line-clamp-2 break-words text-gray-600">
                      {item?.description || commonT("noData")}
                    </p>
                  </td>

                  <td className="px-3 py-4 text-center font-semibold text-gray-900">
                    <span className="block truncate">
                      {formatCurrency(item?.price)}
                    </span>
                  </td>

                

                  <td className="px-3 py-4 text-center">
                    <span
                      className={`inline-flex max-w-full rounded-full px-2.5 py-1 text-xs font-medium ${
                        item?.isDefault
                          ? "bg-primary/10 text-primary"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      <span className="truncate">
                        {item?.isDefault ? t("default") : commonT("no")}
                      </span>
                    </span>
                  </td>

                  <td className="px-3 py-4 text-center">
                    <span
                      className={`inline-flex max-w-full rounded-full px-2.5 py-1 text-xs font-medium ${
                        item?.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      <span className="truncate">
                        {item?.isActive ? commonT("active") : commonT("inactive")}
                      </span>
                    </span>
                  </td>

                  <td className="px-5 py-4">
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
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="border-t border-gray-100 px-4 py-4">
          <PaginationSection {...pagination} onPageChange={setPage} />
        </div>
      </div>

      <div className="w-full max-w-full space-y-4 md:hidden">
        {shouldShowInitialLoader ? (
          Array.from({ length: 5 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))
        ) : shouldShowEmpty ? (
          <div className="rounded-[18px] border border-gray-100 bg-white p-4 shadow-sm">
            <EmptyState />
          </div>
        ) : (
          items.map((item: any) => (
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

                <span
                  className={`shrink-0 rounded-full px-2 py-1 text-xs font-medium ${
                    item?.isActive
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {item?.isActive ? commonT("active") : commonT("inactive")}
                </span>
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
          ))
        )}

        <div className="w-full max-w-full overflow-hidden">
          <PaginationSection {...pagination} onPageChange={setPage} />
        </div>
      </div>

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
