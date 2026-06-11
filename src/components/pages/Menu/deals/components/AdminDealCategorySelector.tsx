"use client";

import type { UIEvent } from "react";
import { useEffect, useMemo, useState } from "react";

import MenuEntitySelector from "@/components/pages/Menu/shared/MenuEntitySelector";
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
  onSelectionOptionsChange?: (categories: AdminDealCategorySummary[]) => void;
  error?: string;
  helpText?: string;
};

const CATEGORY_PAGE_SIZE = 10;

const toCategorySummary = (
  category: MenuCategoryOption | AdminDealCategorySummary,
): AdminDealCategorySummary => ({
  id: category.id,
  name: category.name,
  imageUrl: category.imageUrl ?? null,
  slug: category.slug ?? null,
});

const mergeCategories = (
  current: AdminDealCategorySummary[],
  next: AdminDealCategorySummary[],
) => {
  const categoryMap = new Map<string, AdminDealCategorySummary>();
  [...current, ...next].forEach((category) =>
    categoryMap.set(category.id, category),
  );

  return Array.from(categoryMap.values());
};

export default function AdminDealCategorySelector({
  value,
  onChange,
  restaurantId,
  branchId,
  initialCategories = [],
  onSelectionOptionsChange,
  error,
  helpText,
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
        page.data.map((category) => toCategorySummary(category)),
      ) ?? [];

    return mergeCategories(initialCategories, pageCategories);
  }, [categoriesQuery.data?.pages, initialCategories]);

  const selectedCategories = useMemo(() => {
    return value
      .map((id) => options.find((category) => category.id === id))
      .filter((category): category is AdminDealCategorySummary =>
        Boolean(category),
      );
  }, [options, value]);

  useEffect(() => {
    onSelectionOptionsChange?.(selectedCategories);
  }, [onSelectionOptionsChange, selectedCategories]);

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

    if (
      isNearBottom &&
      categoriesQuery.hasNextPage &&
      !categoriesQuery.isFetchingNextPage
    ) {
      void categoriesQuery.fetchNextPage();
    }
  };

  const loading =
    categoriesQuery.isLoading || categoriesQuery.isFetchingNextPage;

  return (
    <MenuEntitySelector
      value={value}
      options={options}
      search={search}
      selectedOptions={selectedCategories}
      loading={loading}
      hasNext={Boolean(categoriesQuery.hasNextPage)}
      searchPlaceholder={t("searchPlaceholder")}
      imageFallback={t("imageFallback")}
      emptyTitle={t("emptyTitle")}
      selectedCountLabel={t("selectedCount", { count: value.length })}
      clearLabel={t("clear")}
      helpText={helpText || t("help")}
      error={error}
      getImageUrl={(category) => category.imageUrl}
      renderMeta={(category) =>
        category.slug ? (
          <p className="mt-1 truncate text-xs text-gray-500">{category.slug}</p>
        ) : null
      }
      onSearchChange={setSearch}
      onToggle={toggleCategory}
      onClear={() => onChange([])}
      onOptionsScroll={handleOptionsScroll}
    />
  );
}
