"use client";

import { useEffect, useMemo, useState } from "react";
import { FaPen, FaTrash } from "react-icons/fa";
import {
  AlertTriangle,
  Filter,
  FlaskConical,
  Loader2,
  PlusCircle,
  RefreshCcw,
  Search,
  ShieldAlert,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import PaginationSection from "@/components/common/pagination";
import DeleteDialog from "@/components/common/dialogs/delete-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { useAuth } from "@/hooks/useAuth";
import {
  useCreateAllergenAdditiveTemplate,
  useDeleteAllergenAdditiveTemplate,
  useGetAllergenAdditiveTemplates,
  useUpdateSingleAllergenAdditiveTemplate,
} from "@/hooks/useAllergen";
import { useTranslations } from "next-intl";

const PAGE_LIMIT = 10;

type TemplateType = "allergens" | "additives";
type TemplateFilter = "all" | TemplateType;
type SortOrder = "ASC" | "DESC";
type SortBy = "code" | "label" | "type";

type TemplateItem = {
  code: string;
  label: string;
  type: TemplateType;
};

const TYPE_FILTER_OPTIONS: Array<{
  value: TemplateFilter;
}> = [
  {
    value: "all",
  },
  {
    value: "allergens",
  },
  {
    value: "additives",
  },
];

const SORT_OPTIONS: Array<{
  label: string;
  value: SortBy;
}> = [
  {
    label: "Code",
    value: "code",
  },
  {
    label: "Label",
    value: "label",
  },
  {
    label: "Type",
    value: "type",
  },
];

const getTypeLabel = (type: TemplateType) => {
  return type === "allergens" ? "Allergen" : "Additive";
};

const getTypeDescription = (type: TemplateType) => {
  return type === "allergens"
    ? "Allergen templates are used to identify food allergens like gluten, milk, eggs, nuts, or soy."
    : "Additive templates are used to identify additives like colorants, preservatives, antioxidants, or sweeteners.";
};

const extractTemplateItems = (response: any): TemplateItem[] => {
  if (!response) return [];

  const allergensCandidates = [
    response?.data?.allergens,
    response?.data?.data?.allergens,
    response?.allergens,
    response?.data?.templates?.allergens,
    response?.templates?.allergens,
  ];

  const additivesCandidates = [
    response?.data?.additives,
    response?.data?.data?.additives,
    response?.additives,
    response?.data?.templates?.additives,
    response?.templates?.additives,
  ];

  const allergensRaw = allergensCandidates.find((candidate) =>
    Array.isArray(candidate)
  );

  const additivesRaw = additivesCandidates.find((candidate) =>
    Array.isArray(candidate)
  );

  const allergens: TemplateItem[] = Array.isArray(allergensRaw)
    ? allergensRaw
        .map((item) => ({
          code: String(item?.code || "").trim(),
          label: String(item?.label || "").trim(),
          type: "allergens" as const,
        }))
        .filter((item) => item.code || item.label)
    : [];

  const additives: TemplateItem[] = Array.isArray(additivesRaw)
    ? additivesRaw
        .map((item) => ({
          code: String(item?.code || "").trim(),
          label: String(item?.label || "").trim(),
          type: "additives" as const,
        }))
        .filter((item) => item.code || item.label)
    : [];

  return [...allergens, ...additives];
};

const normalizeText = (value: string) => {
  return value.trim().toLowerCase();
};

const sortTemplates = (
  items: TemplateItem[],
  sortBy: SortBy,
  sortOrder: SortOrder
) => {
  return [...items].sort((a, b) => {
    const aValue =
      sortBy === "type"
        ? getTypeLabel(a.type).toLowerCase()
        : normalizeText(a?.[sortBy] || "");

    const bValue =
      sortBy === "type"
        ? getTypeLabel(b.type).toLowerCase()
        : normalizeText(b?.[sortBy] || "");

    const result = aValue.localeCompare(bValue);

    return sortOrder === "ASC" ? result : -result;
  });
};

export default function AllergenTable() {
  const t = useTranslations("menu.allergensTable");
  const commonT = useTranslations("common");
  const { user, restaurantId: authRestaurantId } = useAuth();

  const restaurantId =
    authRestaurantId ?? user?.restaurantId ?? user?.tenantId ?? "";

  const [page, setPage] = useState(1);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [typeFilter, setTypeFilter] = useState<TemplateFilter>("all");
  const [sortBy, setSortBy] = useState<SortBy>("code");
  const [sortOrder, setSortOrder] = useState<SortOrder>("ASC");

  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<TemplateItem | null>(null);
  const [defaultModalType, setDefaultModalType] =
    useState<TemplateType>("allergens");

  const [deleteTarget, setDeleteTarget] = useState<TemplateItem | null>(null);

  const canMutateTemplates = Boolean(restaurantId);

  const {
    data: response,
    isLoading,
    isFetching,
    refetch,
  } = useGetAllergenAdditiveTemplates({
    restaurantId: restaurantId || undefined,
  });

  const { mutate: createTemplate, isPending: isCreating } =
    useCreateAllergenAdditiveTemplate();

  const { mutate: updateTemplate, isPending: isUpdating } =
    useUpdateSingleAllergenAdditiveTemplate();

  const { mutate: deleteTemplate, isPending: isDeleting } =
    useDeleteAllergenAdditiveTemplate();

  const allItems = useMemo(() => {
    return extractTemplateItems(response);
  }, [response]);

  const allergenCount = useMemo(() => {
    return allItems.filter((item) => item.type === "allergens").length;
  }, [allItems]);

  const additiveCount = useMemo(() => {
    return allItems.filter((item) => item.type === "additives").length;
  }, [allItems]);

  const activeTypeOption = useMemo(() => {
    return (
      TYPE_FILTER_OPTIONS.find((option) => option.value === typeFilter) ||
      TYPE_FILTER_OPTIONS[0]
    );
  }, [typeFilter]);
  const getFilterLabel = (value: TemplateFilter) => {
    if (value === "all") return t("filterAll");
    if (value === "allergens") return t("allergens");
    return t("additives");
  };
  const getFilterHelper = (value: TemplateFilter) => {
    if (value === "all") return t("helperAll");
    if (value === "allergens") return t("helperAllergens");
    return t("helperAdditives");
  };
  const getSortLabel = (value: SortBy) => {
    if (value === "code") return t("code");
    if (value === "label") return t("label");
    return commonT("type");
  };

  const filteredItems = useMemo(() => {
    const keyword = normalizeText(debouncedSearch);

    const typeFilteredItems =
      typeFilter === "all"
        ? allItems
        : allItems.filter((item) => item.type === typeFilter);

    const searchedItems = keyword
      ? typeFilteredItems.filter((item) => {
          const searchableText = `${item.code} ${item.label} ${getTypeLabel(
            item.type
          )}`.toLowerCase();

          return searchableText.includes(keyword);
        })
      : typeFilteredItems;

    return sortTemplates(searchedItems, sortBy, sortOrder);
  }, [allItems, debouncedSearch, typeFilter, sortBy, sortOrder]);

  const paginatedItems = useMemo(() => {
    const startIndex = (page - 1) * PAGE_LIMIT;
    return filteredItems.slice(startIndex, startIndex + PAGE_LIMIT);
  }, [filteredItems, page]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_LIMIT));

  const pagination = {
    page,
    totalPages,
    total: filteredItems.length,
    limit: PAGE_LIMIT,
    hasNext: page < totalPages,
    hasPrevious: page > 1,
  };

  const hasActiveFilters = Boolean(
    search.trim() ||
      debouncedSearch ||
      typeFilter !== "all" ||
      sortBy !== "code" ||
      sortOrder !== "ASC"
  );

  const shouldShowInitialLoader = isLoading && allItems.length === 0;
  const shouldShowRefreshing = isFetching && !shouldShowInitialLoader;
  const shouldShowEmpty =
    !isLoading && !isFetching && paginatedItems.length === 0;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 450);

    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const openCreateModal = (type: TemplateType = "allergens") => {
    setSelected(null);
    setDefaultModalType(type);
    setOpen(true);
  };

  const openEditModal = (item: TemplateItem) => {
    setSelected(item);
    setDefaultModalType(item.type);
    setOpen(true);
  };

  const handleManualSearch = () => {
    const nextSearch = search.trim();

    setDebouncedSearch(nextSearch);
    setPage(1);

    if (debouncedSearch === nextSearch) {
      refetch();
    }
  };

  const handleTypeFilterChange = (value: TemplateFilter) => {
    setTypeFilter(value);
    setPage(1);
  };

  const handleResetFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setTypeFilter("all");
    setSortBy("code");
    setSortOrder("ASC");
    setPage(1);

    if (!hasActiveFilters) {
      refetch();
    }
  };

  const handleDelete = () => {
    if (!deleteTarget || !restaurantId) return;

    deleteTemplate(
      {
        type: deleteTarget.type,
        code: deleteTarget.code,
        restaurantId,
      },
      {
        onSuccess: () => {
          setDeleteTarget(null);
          refetch();
        },
      }
    );
  };

  const handleSubmitTemplate = (values: TemplateItem) => {
    if (!restaurantId) return;

    const payload = {
      code: values.code.trim(),
      label: values.label.trim(),
    };

    if (!payload.code || !payload.label) return;

    if (selected) {
      updateTemplate(
        {
          type: selected.type,
          code: selected.code,
          restaurantId,
          payload,
        },
        {
          onSuccess: () => {
            setOpen(false);
            setSelected(null);
            refetch();
          },
        }
      );

      return;
    }

    createTemplate(
      {
        type: values.type,
        restaurantId,
        payload,
      },
      {
        onSuccess: () => {
          setOpen(false);
          setSelected(null);
          setDefaultModalType(values.type);
          setPage(1);
          refetch();
        },
      }
    );
  };

  const SkeletonRow = () => (
    <tr>
      <td colSpan={5} className="px-4 py-5">
        <div className="grid animate-pulse grid-cols-[1fr_2fr_0.8fr_0.8fr_0.5fr] gap-4">
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
        <div className="h-4 w-[120px] max-w-full rounded bg-gray-200" />
        <div className="h-3 w-full rounded bg-gray-200" />
        <div className="h-3 w-[160px] max-w-full rounded bg-gray-200" />
      </div>
    </div>
  );

  const EmptyState = () => (
    <div className="mx-auto max-w-[420px] px-4 py-10 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <ShieldAlert size={22} />
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
        <div className="mt-4 flex flex-col justify-center gap-2 sm:flex-row">
          <Button
            type="button"
            onClick={() => openCreateModal("allergens")}
            disabled={!canMutateTemplates}
            className="rounded-[12px] bg-primary text-white hover:bg-primary/90"
          >
            <PlusCircle size={18} className="mr-2" />
            {t("addAllergen")}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => openCreateModal("additives")}
            disabled={!canMutateTemplates}
            className="rounded-[12px]"
          >
            <PlusCircle size={18} className="mr-2" />
            {t("addAdditive")}
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <div className="w-full max-w-full overflow-hidden">
      <div className="mb-5 flex min-w-0 flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <h2 className="text-[20px] font-semibold text-gray-900">
            {t("title")}
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            {t("description")}
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            onClick={() => openCreateModal("allergens")}
            disabled={!canMutateTemplates}
            className="h-[42px] shrink-0 rounded-[12px] bg-primary px-4 text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <PlusCircle size={18} className="mr-2" />
            {t("addAllergen")}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => openCreateModal("additives")}
            disabled={!canMutateTemplates}
            className="h-[42px] shrink-0 rounded-[12px] border-gray-200 px-4 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <PlusCircle size={18} className="mr-2" />
            {t("addAdditive")}
          </Button>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-3">
        <SummaryCard
          label={t("totalTemplates")}
          value={allItems.length}
          icon={<ShieldAlert size={18} />}
        />
        <SummaryCard
          label={t("allergens")}
          value={allergenCount}
          icon={<AlertTriangle size={18} />}
        />
        <SummaryCard
          label={t("additives")}
          value={additiveCount}
          icon={<FlaskConical size={18} />}
        />
      </div>

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
                  {getFilterHelper(activeTypeOption.value)}
                </span>
              </p>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2 text-xs text-gray-500">
            <span className="rounded-full bg-gray-100 px-2.5 py-1 font-medium text-gray-600">
              {t("showingCount", { shown: paginatedItems.length, total: filteredItems.length })}
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

          <div className="min-w-0 xl:col-span-3">
            <label className="mb-1.5 block text-xs font-medium text-gray-600">
              {commonT("type")}
            </label>

            <div className="grid min-w-0 grid-cols-3 gap-2 rounded-[14px] bg-[#F7F7F7] p-1">
              {TYPE_FILTER_OPTIONS.map((option) => {
                const isActive = typeFilter === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleTypeFilterChange(option.value)}
                    className={`h-[38px] min-w-0 rounded-[11px] px-2 text-xs font-semibold transition ${
                      isActive
                        ? "bg-white text-primary shadow-sm ring-1 ring-primary/10"
                        : "text-gray-500 hover:bg-white/70 hover:text-gray-800"
                    }`}
                  >
                    <span className="block truncate">{getFilterLabel(option.value)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="min-w-0 xl:col-span-2">
            <label className="mb-1.5 block text-xs font-medium text-gray-600">
              {commonT("sortBy")}
            </label>

            <select
              value={sortBy}
              onChange={(event) => {
                setSortBy(event.target.value as SortBy);
                setPage(1);
              }}
              className="h-[44px] w-full min-w-0 rounded-[14px] border border-gray-200 bg-[#FAFAFA] px-4 text-sm text-gray-700 outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {getSortLabel(option.value)}
                </option>
              ))}
            </select>
          </div>

          <div className="min-w-0 xl:col-span-1">
            <label className="mb-1.5 block text-xs font-medium text-gray-600">
              {commonT("order")}
            </label>

            <select
              value={sortOrder}
              onChange={(event) => {
                setSortOrder(event.target.value as SortOrder);
                setPage(1);
              }}
              className="h-[44px] w-full min-w-0 rounded-[14px] border border-gray-200 bg-[#FAFAFA] px-3 text-sm text-gray-700 outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
            >
              <option value="ASC">ASC</option>
              <option value="DESC">DESC</option>
            </select>
          </div>

          <Button
            onClick={handleManualSearch}
            className="h-[44px] rounded-[14px] bg-primary px-5 text-white shadow-sm hover:bg-primary/90 md:w-full xl:col-span-1"
          >
            {commonT("search")}
          </Button>

          <Button
            type="button"
            variant="outline"
            disabled={!hasActiveFilters && !isFetching}
            onClick={handleResetFilters}
            className="h-[44px] rounded-[14px] border-gray-200 px-4 text-gray-700 md:w-full xl:col-span-1"
          >
            <RefreshCcw size={15} className="mr-2" />
            {commonT("reset")}
          </Button>
        </div>
      </div>

      {!canMutateTemplates ? (
        <div className="mb-6 rounded-[18px] border border-amber-100 bg-amber-50 p-4 text-sm text-amber-700">
          {t("missingRestaurantContext")}
        </div>
      ) : null}

      <div className="hidden w-full max-w-full overflow-hidden rounded-[18px] border border-gray-100 bg-white shadow-sm md:block">
        <table className="w-full table-fixed text-sm">
          <thead>
            <tr className="border-b bg-[#FAFAFA] text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              <th className="w-[20%] px-4 py-4">{t("code")}</th>
              <th className="w-[42%] px-4 py-4">{t("label")}</th>
              <th className="w-[18%] px-4 py-4 text-center">{commonT("type")}</th>
              <th className="w-[10%] px-4 py-4 text-center">{t("usage")}</th>
              <th className="w-[10%] px-4 py-4 text-center">{commonT("actions")}</th>
            </tr>
          </thead>

          <tbody>
            {shouldShowInitialLoader ? (
              Array.from({ length: 6 }).map((_, index) => (
                <SkeletonRow key={index} />
              ))
            ) : shouldShowEmpty ? (
              <tr>
                <td colSpan={5}>
                  <EmptyState />
                </td>
              </tr>
            ) : (
              paginatedItems.map((item) => (
                <tr
                  key={`${item.type}-${item.code}`}
                  className="border-b border-gray-100 transition hover:bg-[#FAFAFA]"
                >
                  <td className="px-4 py-4">
                    <div className="inline-flex max-w-full rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                      <span className="truncate">{item.code || "-"}</span>
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    <p className="truncate font-semibold text-gray-900">
                      {item.label || "-"}
                    </p>
                  </td>

                  <td className="px-4 py-4 text-center">
                    <TemplateTypeBadge type={item.type} />
                  </td>

                  <td className="px-4 py-4 text-center">
                    <span className="text-xs text-gray-500">
                      {t("template")}
                    </span>
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        title={commonT("edit")}
                        disabled={!canMutateTemplates}
                        onClick={() => openEditModal(item)}
                        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm transition-all duration-200 hover:-translate-y-[1px] hover:border-primary/20 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label={t("editAria")}
                      >
                        <FaPen size={13} />
                      </button>

                      <button
                        type="button"
                        title={commonT("delete")}
                        disabled={!canMutateTemplates}
                        onClick={() => setDeleteTarget(item)}
                        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm transition-all duration-200 hover:-translate-y-[1px] hover:border-red-200 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-50"
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
          paginatedItems.map((item) => (
            <div
              key={`${item.type}-${item.code}`}
              className="w-full max-w-full overflow-hidden rounded-[18px] border border-gray-100 bg-white p-4 shadow-sm"
            >
              <div className="flex min-w-0 items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="inline-flex max-w-full rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    <span className="truncate">{item.code || "-"}</span>
                  </div>

                  <h3 className="mt-3 truncate text-[16px] font-semibold text-gray-900">
                    {item.label || "-"}
                  </h3>

                  <p className="mt-1 text-xs text-gray-400">
                    {item.type === "allergens" ? t("allergenDescription") : t("additiveDescription")}
                  </p>
                </div>

                <TemplateTypeBadge type={item.type} />
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-end gap-3">
                <button
                  type="button"
                  disabled={!canMutateTemplates}
                  onClick={() => openEditModal(item)}
                  className="inline-flex items-center gap-2 rounded-[10px] border border-gray-200 px-3 py-2 text-sm text-gray-700 transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <FaPen size={13} />
                  {commonT("edit")}
                </button>

                <button
                  type="button"
                  disabled={!canMutateTemplates}
                  onClick={() => setDeleteTarget(item)}
                  className="inline-flex items-center gap-2 rounded-[10px] border border-gray-200 px-3 py-2 text-sm text-gray-700 transition hover:border-red-300 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-50"
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

      <TemplateModal
        open={open}
        initialData={selected}
        defaultType={defaultModalType}
        loading={isCreating || isUpdating}
        onOpenChange={(value) => {
          setOpen(value);

          if (!value) {
            setSelected(null);
          }
        }}
        onSubmit={handleSubmitTemplate}
      />

      <DeleteDialog
        open={!!deleteTarget}
        onOpenChange={(value) => {
          if (!value) {
            setDeleteTarget(null);
          }
        }}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        title={t("deleteTitle", {
          type: deleteTarget ? (deleteTarget.type === "allergens" ? t("allergen") : t("additive")) : t("template"),
        })}
        description={t("deleteDescription", {
          type: deleteTarget ? (deleteTarget.type === "allergens" ? t("allergen").toLowerCase() : t("additive").toLowerCase()) : t("template").toLowerCase(),
        })}
      />
    </div>
  );
}

function TemplateTypeBadge({ type }: { type: TemplateType }) {
  const t = useTranslations("menu.allergensTable");
  const isAllergen = type === "allergens";

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
        isAllergen
          ? "bg-amber-50 text-amber-700"
          : "bg-blue-50 text-blue-700"
      }`}
    >
      {isAllergen ? t("allergen") : t("additive")}
    </span>
  );
}

function SummaryCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-4 rounded-[18px] border border-gray-100 bg-white p-4 shadow-sm">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-primary/10 text-primary">
        {icon}
      </div>

      <div>
        <p className="text-2xl font-semibold leading-none text-gray-950">
          {value}
        </p>
        <p className="mt-1 text-sm text-gray-500">{label}</p>
      </div>
    </div>
  );
}

function TemplateModal({
  open,
  initialData,
  defaultType,
  loading,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  initialData: TemplateItem | null;
  defaultType: TemplateType;
  loading: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: TemplateItem) => void;
}) {
  const t = useTranslations("menu.allergensTable.modal");
  const tableT = useTranslations("menu.allergensTable");
  const commonT = useTranslations("common");
  const [form, setForm] = useState<TemplateItem>({
    code: "",
    label: "",
    type: defaultType,
  });

  useEffect(() => {
    if (!open) return;

    setForm({
      code: initialData?.code || "",
      label: initialData?.label || "",
      type: initialData?.type || defaultType,
    });
  }, [open, initialData, defaultType]);

  const canSubmit = Boolean(form.code.trim() && form.label.trim());

  const handleSubmit = () => {
    if (!canSubmit || loading) return;

    onSubmit({
      code: form.code.trim(),
      label: form.label.trim(),
      type: form.type,
    });
  };

  const isEditMode = Boolean(initialData);

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal>
      <DialogContent
        className="max-w-[560px] rounded-[22px] border-0 bg-white p-0 shadow-xl"
        onCloseAutoFocus={(event) => event.preventDefault()}
      >
        <DialogHeader className="border-b border-gray-100 px-5 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <DialogTitle className="text-xl font-semibold text-gray-950">
                {isEditMode
                  ? t("editTitle", { type: form.type === "allergens" ? tableT("allergen") : tableT("additive") })
                  : t("addTitle")}
              </DialogTitle>

              <p className="mt-1 text-sm text-gray-500">
                {t("description")}
              </p>
            </div>

          
          </div>
        </DialogHeader>

        <div className="space-y-4 px-5 py-5">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
              {t("templateType")}
            </label>

            <select
              value={form.type}
              disabled={isEditMode}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  type: event.target.value as TemplateType,
                }))
              }
              className="h-[44px] w-full rounded-[14px] border border-gray-200 bg-[#FAFAFA] px-4 text-sm text-gray-900 outline-none transition focus:border-primary/40 focus:bg-white focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
            >
              <option value="allergens">{tableT("allergen")}</option>
              <option value="additives">{tableT("additive")}</option>
            </select>

            {isEditMode ? (
              <p className="mt-1.5 text-xs text-gray-400">
                {t("typeLockedHelp")}
              </p>
            ) : null}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
              {tableT("code")}
            </label>

            <input
              value={form.code}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  code: event.target.value,
                }))
              }
              placeholder={
                form.type === "allergens"
                  ? tableT("codePlaceholderAllergen")
                  : tableT("codePlaceholderAdditive")
              }
              className="h-[44px] w-full rounded-[14px] border border-gray-200 bg-[#FAFAFA] px-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-primary/40 focus:bg-white focus:ring-2 focus:ring-primary/15"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
              {tableT("label")}
            </label>

            <input
              value={form.label}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  label: event.target.value,
                }))
              }
              placeholder={
                form.type === "allergens"
                  ? tableT("labelPlaceholderAllergen")
                  : tableT("labelPlaceholderAdditive")
              }
              className="h-[44px] w-full rounded-[14px] border border-gray-200 bg-[#FAFAFA] px-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-primary/40 focus:bg-white focus:ring-2 focus:ring-primary/15"
            />
          </div>

          <div
            className={`rounded-[14px] border p-4 ${
              form.type === "allergens"
                ? "border-amber-100 bg-amber-50"
                : "border-blue-100 bg-blue-50"
            }`}
          >
            <div className="flex items-start gap-3">
              {form.type === "allergens" ? (
                <AlertTriangle
                  size={18}
                  className="mt-0.5 shrink-0 text-amber-600"
                />
              ) : (
                <FlaskConical
                  size={18}
                  className="mt-0.5 shrink-0 text-blue-600"
                />
              )}

              <p
                className={`text-sm leading-6 ${
                  form.type === "allergens"
                    ? "text-amber-800"
                    : "text-blue-800"
                }`}
              >
                {form.type === "allergens" ? tableT("allergenDescription") : tableT("additiveDescription")}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-gray-100 px-5 py-4 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={() => onOpenChange(false)}
            className="rounded-[12px]"
          >
            {commonT("cancel")}
          </Button>

          <Button
            type="button"
            disabled={!canSubmit || loading}
            onClick={handleSubmit}
            className="rounded-[12px] bg-primary text-white hover:bg-primary/90 disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />
                {commonT("saving")}
              </>
            ) : isEditMode ? (
              t("update", { type: form.type === "allergens" ? tableT("allergen") : tableT("additive") })
            ) : (
              t("create", { type: form.type === "allergens" ? tableT("allergen") : tableT("additive") })
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
