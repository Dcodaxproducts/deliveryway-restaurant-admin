"use client";

import type { UIEvent } from "react";
import { useEffect, useMemo, useState } from "react";

import { formatDealPrice } from "@/components/pages/Menu/deals/utils/admin-deals-formatters";
import MenuEntitySelector from "@/components/pages/Menu/shared/MenuEntitySelector";
import { useAdminDealMenuItems } from "@/hooks/useAdminDealMenuItems";
import type { AdminDealMenuItemSummary } from "@/types/admin-deals";
import { useTranslations } from "next-intl";

type AdminDealMenuItemSelectorProps = {
  value: string[];
  onChange: (value: string[]) => void;
  restaurantId?: string;
  initialItems?: AdminDealMenuItemSummary[];
  error?: string;
  helpText?: string;
};

const MENU_ITEMS_PAGE_SIZE = 10;

export default function AdminDealMenuItemSelector({
  value,
  onChange,
  restaurantId,
  initialItems = [],
  error,
  helpText,
}: AdminDealMenuItemSelectorProps) {
  const t = useTranslations("deals.menuItemSelector");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { options, hasNext, loading } = useAdminDealMenuItems({
    page,
    limit: MENU_ITEMS_PAGE_SIZE,
    search,
    restaurantId,
    initialItems,
  });

  useEffect(() => {
    setPage(1);
  }, [restaurantId]);

  const selectedItems = useMemo(() => {
    return value
      .map((id) => options.find((item) => item.id === id))
      .filter((item): item is AdminDealMenuItemSummary => Boolean(item));
  }, [options, value]);

  const toggleItem = (item: AdminDealMenuItemSummary) => {
    if (value.includes(item.id)) {
      onChange(value.filter((id) => id !== item.id));
      return;
    }

    onChange([...value, item.id]);
  };

  const handleOptionsScroll = (event: UIEvent<HTMLDivElement>) => {
    const element = event.currentTarget;
    const isNearBottom =
      element.scrollHeight - element.scrollTop <= element.clientHeight + 40;

    if (isNearBottom && hasNext && !loading) {
      setPage((currentPage) => currentPage + 1);
    }
  };

  return (
    <MenuEntitySelector
      value={value}
      options={options}
      search={search}
      selectedOptions={selectedItems}
      loading={loading}
      hasNext={hasNext}
      searchPlaceholder={t("searchPlaceholder")}
      imageFallback={t("imageFallback")}
      emptyTitle={t("emptyTitle")}
      selectedCountLabel={t("selectedCount", { count: value.length })}
      clearLabel={t("clear")}
      helpText={helpText || t("help")}
      loadMoreHint={t("loadMoreHint")}
      showingCountLabel={t("showingCount", {
        count: options.length.toLocaleString(),
      })}
      error={error}
      getImageUrl={(item) => item.imageUrl}
      renderMeta={(item) => (
        <p className="mt-1 truncate text-xs text-gray-500">
          {item.category?.name || t("noCategory")} •{" "}
          {formatDealPrice(item.basePrice)}
        </p>
      )}
      onSearchChange={(nextSearch) => {
        setPage(1);
        setSearch(nextSearch);
      }}
      onToggle={toggleItem}
      onClear={() => onChange([])}
      onOptionsScroll={handleOptionsScroll}
    />
  );
}
