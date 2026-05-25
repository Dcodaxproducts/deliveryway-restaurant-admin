"use client";

import Container from "@/components/container";
import Categories from "@/components/menu/listing/categories";
import Header from "@/components/menu/listing/header";
import ItemList from "@/components/menu/listing/itemList";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useHttpClient } from "@/hooks/useHttpClient";
import { useAuth } from "@/hooks/useAuth";

export default function MenusListingPage() {
  const [editing, setEditing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [items, setItems] = useState<any[]>([]);

  //  CONSISTENT with Orders page
  const { token, user } = useAuth();
  const { get, loading } = useHttpClient(token);

  const searchParams = useSearchParams();
  const menuId = searchParams.get("id");

  const handleManageClick = () => {
    setEditing((prev) => !prev);
  };

  /* ================= FETCH ITEMS ================= */
  const fetchItems = async () => {
    const restaurantId = user?.restaurantId;

    if (!restaurantId || !menuId) return;
// &menuId=${menuId}
    let url = `/v1/menu/items?restaurantId=${restaurantId}&menuId=${menuId}`;

    if (selectedCategory) {
      url += `&categoryId=${selectedCategory}`;
    }

    const res = await get(url);
    if (!res) return;

    setItems(res.data);
  };

  useEffect(() => {
  
    fetchItems();
  }, [token, user?.restaurantId, menuId, selectedCategory]);
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
         refetch={fetchItems} 
      />
    </Container>
  );
}