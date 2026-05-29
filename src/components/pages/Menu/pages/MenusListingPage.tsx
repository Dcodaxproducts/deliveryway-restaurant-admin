"use client";

import Container from "@/components/common/Container";
import Categories from "@/components/pages/Menu/legacy/root-menu-components/listing/categories";
import Header from "@/components/pages/Menu/legacy/root-menu-components/listing/header";
import ItemList from "@/components/pages/Menu/legacy/root-menu-components/listing/itemList";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useGetMenuItems } from "@/hooks/useMenus";

export default function MenusListingPage() {
  const [editing, setEditing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { user } = useAuth();

  const searchParams = useSearchParams();
  const menuId = searchParams.get("id");

  const handleManageClick = () => {
    setEditing((prev) => !prev);
  };

  const restaurantId = user?.restaurantId;
  const { data: itemsResponse, isLoading, isFetching, refetch } = useGetMenuItems({
    restaurantId: restaurantId || undefined,
    menuId: menuId || undefined,
    categoryId: selectedCategory || undefined,
  });

  const items = itemsResponse?.data || [];
  const loading = isLoading || isFetching;
  return (
    <Container>
      <Header
        title="Menu Listing"
        description="Menu List"
        editing={editing}
        onManageClick={handleManageClick}
      />

      <Categories
        editing={editing}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      <ItemList
        editing={editing}
        items={items}
        loading={loading}
         refetch={refetch} 
      />
    </Container>
  );
}