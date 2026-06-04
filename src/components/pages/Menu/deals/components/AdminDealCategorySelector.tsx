"use client";

import { Check, Loader2, Search, X } from "lucide-react";
import type { UIEvent } from "react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { useInfiniteCategories } from "@/hooks/useMenuCategories";
import type { AdminDealCategorySummary } from "@/types/admin-deals";
import type { MenuCategoryOption } from "@/types/categories";
import { useTranslations } from "next-intl";

type AdminDealCategorySelectorProps = {
  value: string[];
  onChange: (value: string[]) => void;
  restaurantId?: string;
  branchId?: string;
  initialCategories?: AdminDealCategorySummary[];
  error?: string;
};

const CATEGORY_PAGE_SIZE = 10;

const toCategorySummary = (
  category: MenuCategoryOption | AdminDealCategorySummary
): AdminDealCategorySummary => ({
  id: category.id,
  name: category.name,
  imageUrl: category.imageUrl ?? null,
  slug: category.slug ?? null,
});

const mergeCategories = (
  current: AdminDealCategorySummary[],
  next: AdminDealCategorySummary[]
) => {
  const categoryMap = new Map<string, AdminDealCategorySummary>();
  [...current, ...next].forEach((category) => categoryMap.set(category.id, category));

  return Array.from(categoryMap.values());
};

export default function AdminDealCategorySelector({
  value,
  onChange,
  restaurantId,
  branchId,
  initialCategories = [],
  error,
}: AdminDealCategorySelectorProps) {
  const t = useTranslations("deals.categorySelector");
  const [search, setSearch] = useState("");
  const categoriesQuery = useInfiniteCategories({
    restaurantId,
    branchId,
    search,
    limit: CATEGORY_PAGE_SIZE,
    includeInactive: false,
  });

  const options = useMemo(() => {
    const pageCategories =
      categoriesQuery.data?.pages.flatMap((page) =>
        page.data.map((category) => toCategorySummary(category))
      ) ?? [];

    return mergeCategories(initialCategories, pageCategories);
  }, [categoriesQuery.data?.pages, initialCategories]);

  const selectedCategories = useMemo(() => {
    return value
      .map((id) => options.find((category) => category.id === id))
      .filter((category): category is AdminDealCategorySummary => Boolean(category));
  }, [options, value]);

  const toggleCategory = (category: AdminDealCategorySummary) => {
    if (value.includes(category.id)) {
      onChange(value.filter((id) => id !== category.id));
      return;
    }

    onChange([...value, category.id]);
  };

  const handleOptionsScroll = (event: UIEvent<HTMLDivElement>) => {
    const element = event.currentTarget;
    const isNearBottom =
      element.scrollHeight - element.scrollTop <= element.clientHeight + 40;

    if (isNearBottom && categoriesQuery.hasNextPage && !categoriesQuery.isFetchingNextPage) {
      void categoriesQuery.fetchNextPage();
    }
  };

  const loading = categoriesQuery.isLoading || categoriesQuery.isFetchingNextPage;

  return (
    <div className="space-y-3">
      <div className="rounded-[14px] border border-gray-200 bg-white">
        <div className="border-b border-gray-100 p-3">
          <div className="relative">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("searchPlaceholder")}
              className="h-[42px] w-full rounded-[12px] border border-gray-200 bg-[#FAFAFA] pl-10 pr-3 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
            />
          </div>
        </div>

        <div
          className="max-h-[360px] overflow-y-auto p-2"
          onScroll={handleOptionsScroll}
        >
          {options.map((category) => {
            const selected = value.includes(category.id);

            return (
              <button
                key={category.id}
                type="button"
                onClick={() => toggleCategory(category)}
                className={`mb-2 flex w-full items-center gap-3 rounded-[12px] border p-3 text-left transition ${
                  selected
                    ? "border-primary/30 bg-primary/5"
                    : "border-gray-100 hover:bg-gray-50"
                }`}
              >
                {category.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={category.imageUrl}
                    alt={category.name}
                    className="h-12 w-12 shrink-0 rounded-[10px] object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[10px] bg-gray-100 text-xs font-semibold text-gray-400">
                    {t("imageFallback")}
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-gray-900">
                    {category.name}
                  </p>
                  {category.slug ? (
                    <p className="mt-1 truncate text-xs text-gray-500">
                      {category.slug}
                    </p>
                  ) : null}
                </div>

                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                    selected
                      ? "border-primary bg-primary text-white"
                      : "border-gray-200 text-transparent"
                  }`}
                >
                  <Check size={14} />
                </span>
              </button>
            );
          })}

          {loading ? (
            <div className="flex justify-center p-4">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : null}

          {!loading && options.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-400">
              {t("emptyTitle")}
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
          {t("selectedCount", { count: value.length })}
        </span>
        {value.length > 0 ? (
          <Button
            type="button"
            variant="ghost"
            onClick={() => onChange([])}
            className="h-8 rounded-full px-3 text-xs text-gray-500"
          >
            <X size={13} className="mr-1" />
            {t("clear")}
          </Button>
        ) : null}
      </div>

      {selectedCategories.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {selectedCategories.map((category) => (
            <span
              key={category.id}
              className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
            >
              {category.name}
            </span>
          ))}
        </div>
      ) : null}

      <p className={error ? "text-xs text-primary" : "text-xs text-gray-500"}>
        {error || t("help")}
      </p>
    </div>
  );
}
