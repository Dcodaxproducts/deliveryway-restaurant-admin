"use client";

import Header from "@/components/pages/Pos/components/pos/header";
import Container from "@/components/common/Container";
import PosSearchFilter from "@/components/pages/Pos/components/pos/PosSearchFilter";
import Categories from "@/components/pages/Menu/legacy/root-menu-components/listing/categories";
import ItemList from "@/components/pages/Menu/legacy/root-menu-components/listing/itemList";
import PosCart from "@/components/pages/Pos/components/pos/PosCart";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useGetMenuItems } from "@/hooks/useMenus";
import { useTranslations } from "next-intl";

export default function Orders() {
  const t = useTranslations("pos");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [itemPage, setItemPage] = useState(1);
  const [allItems, setAllItems] = useState<any[]>([]);
  const { user, isBranchAdmin } = useAuth();
  const restaurantId = user?.restaurantId;
  const itemLimit = 10;
  const { data: itemsResponse, isLoading, isFetching } = useGetMenuItems({
    restaurantId: restaurantId || undefined,
    categoryId: selectedCategory || undefined,
    page: itemPage,
    limit: itemLimit,
  });

  const items = allItems;
  const latestItems = useMemo(() => itemsResponse?.data || [], [itemsResponse?.data]);
  const itemMeta = itemsResponse?.meta;
  const totalItems = Number(itemMeta?.total) || items.length;
  const totalItemPages = Math.max(
    1,
    Number(itemMeta?.totalPages) || Math.ceil(totalItems / itemLimit) || 1,
  );
  const hasMoreItems =
    typeof itemMeta?.hasNext === "boolean"
      ? itemMeta.hasNext
      : itemPage < totalItemPages || latestItems.length >= itemLimit;
  const loading = isLoading || isFetching;

  useEffect(() => {
    setItemPage(1);
    setAllItems([]);
  }, [selectedCategory, restaurantId]);

  useEffect(() => {
    setAllItems((currentItems) => {
      const sourceItems = latestItems || [];

      if (itemPage === 1) return sourceItems;

      const existingIds = new Set(currentItems.map((item: any) => item?.id));
      const nextItems = sourceItems.filter((item: any) => !existingIds.has(item?.id));

      return [...currentItems, ...nextItems];
    });
  }, [itemPage, latestItems]);

  return (
    <Container>
      <Header
        title={isBranchAdmin ? t("branchTitle") : t("title")}
        description={
          isBranchAdmin
            ? t("branchDescription")
            : t("description")
        }
      />

      <PosSearchFilter />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT SIDE */}
        <div className="lg:col-span-9">
          
          <Categories
            showAddNew={false}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />

          <ItemList
            headerText={t("foodList")}
            addNewText={t("manageFood")}
            items={items}
            loading={loading}
            isLoadingMore={isFetching && itemPage > 1}
            shownCount={items.length}
            totalCount={totalItems}
            hasMore={hasMoreItems}
            onLoadMore={() => {
              if (!isFetching && hasMoreItems) {
                setItemPage((page) => page + 1);
              }
            }}
            editing={false}
          />
        </div>

        {/* RIGHT SIDE */}
        <div className="lg:col-span-3">
          <PosCart />
        </div>

      </div>
    </Container>
  );
}
