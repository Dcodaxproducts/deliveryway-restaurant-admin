"use client";

import Header from "@/components/pos/header";
import Container from "@/components/container";
import PosSearchFilter from "@/components/pos/PosSearchFilter";
import Categories from "@/components/menu/listing/categories";
import ItemList from "@/components/menu/listing/itemList";
import PosCart from "@/components/pos/PosCart";

import { useEffect, useState } from "react";
import { useHttpClient } from "@/hooks/useHttpClient";
import { useAuth } from "@/hooks/useAuth";

export default function Orders() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [items, setItems] = useState<any[]>([]);

  //  NEW: get user from context instead of localStorage
  const { token, user, branchId, isBranchAdmin } = useAuth();
  const { get, loading } = useHttpClient(token);
  /* ================= FETCH ITEMS ================= */

  const fetchItems = async () => {
    const restaurantId = user?.restaurantId;

    if (!restaurantId) return;

    let url = `/v1/menu/items?restaurantId=${restaurantId}`;

    if (selectedCategory) {
      url += `&categoryId=${selectedCategory}`;
    }

    const res = await get(url);

    if (!res) return;

    setItems(res.data);
  };

  useEffect(() => {
    fetchItems();
  }, [token, user?.restaurantId, selectedCategory]);

  return (
    <Container>
      <Header
        title={isBranchAdmin ? "Branch POS" : "Create New Order"}
        description={
          isBranchAdmin
            ? "Create walk-in or takeaway orders for your assigned branch."
            : "Create new order and manage from here."
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
            headerText="Food List"
            addNewText="Manage Food"
            items={items}
            loading={loading}
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