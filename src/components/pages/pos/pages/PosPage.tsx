"use client";

import Header from "@/components/pages/Pos/components/pos/header";
import Container from "@/components/common/Container";
import PosSearchFilter from "@/components/pages/Pos/components/pos/PosSearchFilter";
import Categories from "@/components/pages/Menu/legacy/root-menu-components/listing/categories";
import ItemList from "@/components/pages/Menu/legacy/root-menu-components/listing/itemList";
import PosCart from "@/components/pages/Pos/components/pos/PosCart";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useGetMenuItems } from "@/hooks/useMenus";

export default function Orders() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { user, isBranchAdmin } = useAuth();
  const restaurantId = user?.restaurantId;
  const { data: itemsResponse, isLoading, isFetching } = useGetMenuItems({
    restaurantId: restaurantId || undefined,
    categoryId: selectedCategory || undefined,
  });

  const items = itemsResponse?.data || [];
  const loading = isLoading || isFetching;

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