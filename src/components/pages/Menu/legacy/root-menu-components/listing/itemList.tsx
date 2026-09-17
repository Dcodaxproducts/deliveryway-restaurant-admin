"use client";

import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import MenuItemCard from "@/components/cards/MenuItemCard";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import CreateMenuItemModal from "../CreateMenuItemModal/CreateMenuItemModal";
import { useTranslations } from "next-intl";
import { SectionCard } from "@/components/common/SectionCard";
import { StatePanel } from "@/components/common/EmptyState";

interface ItemListProps {
  editing?: boolean;
  items: any[];
  loading?: boolean;
  error?: string | null;
  showAddNew?: boolean;
  headerText?: string;
  addNewText?: string;
  refetch?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  shownCount?: number;
  totalCount?: number;
  onLoadMore?: () => void;
}

export default function ItemList({
  items,
  loading,
  error,
  showAddNew = true,
  headerText,
  addNewText,
  refetch,
  hasMore = false,
  isLoadingMore = false,
  shownCount,
  totalCount,
  onLoadMore,
}: ItemListProps) {
  const t = useTranslations("menu.listingItems");
  const commonT = useTranslations("common");
  const [createMenuItem, setCreateMenuItem] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const pathname = usePathname();
  const isPOS = pathname?.includes("/pos");
  const { isBranchAdmin } = useAuth();
  const canManageItems = !isBranchAdmin;
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const gridCols = isPOS
    ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3"
    : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4";

  useEffect(() => {
    if (!isPOS || !hasMore || isLoadingMore || !onLoadMore) return;

    const target = loadMoreRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          onLoadMore();
        }
      },
      { rootMargin: "220px" },
    );

    observer.observe(target);

    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, isPOS, onLoadMore]);

  return (
    <SectionCard
      variant={isPOS ? "outlined" : "plain"}
      padding={isPOS ? "sm" : "none"}
      className={isPOS ? "w-full overflow-visible" : "w-full overflow-visible py-4"}
      title={headerText || t("title")}
      action={(
        <div className="flex flex-wrap items-center justify-end gap-3">
        {isPOS && typeof shownCount === "number" ? (
          <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-semibold text-gray-600">
            Showing {shownCount} of {totalCount ?? shownCount} items
          </span>
        ) : null}

        {showAddNew && (
          <Button
            variant="link"
            size="sm"
            className="inline-flex items-center gap-2 text-primary font-semibold text-[16px]"
            onClick={() => setCreateMenuItem(true)}
          >
            <PlusCircle className="w-4 h-4" />
            {addNewText || t("addNewItem")}
          </Button>
        )}
        </div>
      )}
    >
      {!loading && error ? (
        <StatePanel state="error" title={commonT("unableToLoad")} description={error} compact />
      ) : null}

      {/* ITEMS */}
      {loading ? (
        <StatePanel state="loading" title={commonT("loading")} description="" />
      ) : items.length === 0 ? (error ? null : (
        <StatePanel
          state="empty"
          title={t("emptyTitle")}
          description={t("emptyDescription")}
          icon={<PlusCircle />}
          action={showAddNew ? (
            <Button
              className="bg-primary hover:bg-red-600 text-white rounded-[10px] px-5"
              onClick={() => setCreateMenuItem(true)}
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              {addNewText || t("addNewItem")}
            </Button>
          ) : null}
        />
      )) : (
        <>
          <div className={`grid ${gridCols} gap-4`}>
            {items.map((item) => (
              <MenuItemCard
                key={item.id}
                item={item}
                editing={canManageItems}
                density={isPOS ? "compact" : "default"}
                onEdit={() => {
                  setSelectedItem(item);
                  setCreateMenuItem(true);
                }}
                onDelete={refetch}
              />
            ))}
          </div>
          {isPOS ? (
            <div ref={loadMoreRef} className="flex min-h-[72px] items-center justify-center py-5">
              {isLoadingMore ? (
                <div className="flex items-center gap-3 rounded-full bg-white px-4 py-2 text-sm font-semibold text-gray-600 shadow-sm">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  Loading more items...
                </div>
              ) : hasMore ? (
                <button
                  type="button"
                  onClick={onLoadMore}
                  className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-600 shadow-sm transition hover:border-primary/30 hover:text-primary hover:shadow-md"
                >
                  Load more items
                </button>
              ) : items.length > 0 ? (
                <span className="text-sm font-medium text-gray-400">All items loaded</span>
              ) : null}
            </div>
          ) : null}
        </>
      )}

      <CreateMenuItemModal
        open={createMenuItem}
        onOpenChange={(open) => {
          setCreateMenuItem(open);

          if (!open) {
            setSelectedItem(null);
          }
        }}
        initialData={selectedItem}
        onSuccess={refetch}
      />
    </SectionCard>
  );
}
