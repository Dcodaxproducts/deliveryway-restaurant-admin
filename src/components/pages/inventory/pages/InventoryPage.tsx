"use client";

import { useMemo, useState } from "react";
import Container from "@/components/common/Container";
import Header from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import {
  useCreateInventoryMovement,
  useInventoryCategories,
  useInventoryItems,
  useInventoryMovements,
  useInventoryRecipes,
} from "@/hooks/useInventory";

type InventoryTab = "items" | "movements" | "recipes" | "categories";

const inventoryTabs: { key: InventoryTab; label: string }[] = [
  { key: "items", label: "Items" },
  { key: "movements", label: "Movements" },
  { key: "recipes", label: "Recipes" },
  { key: "categories", label: "Categories" },
];

const loadingRows = Array.from({ length: 5 }, (_, index) => `loading-row-${index}`);

const normalizeRows = (response: any) => {
  const candidates = [
    response?.data,
    response?.data?.items,
    response?.data?.data,
    response?.items,
    response,
  ];

  return candidates.find(Array.isArray) || [];
};

export default function InventoryPage() {
  const { restaurantId, branchId, isBranchAdmin, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<InventoryTab>("items");
  const [search, setSearch] = useState("");
  const [movement, setMovement] = useState({
    itemId: "",
    type: "ADJUSTMENT" as "IN" | "OUT" | "ADJUSTMENT",
    quantity: "",
    reason: "",
  });

  const params = useMemo(
    () => ({
      restaurantId: restaurantId || undefined,
      branchId: branchId || undefined,
      search: search.trim() || undefined,
      page: 1,
      limit: 50,
    }),
    [restaurantId, branchId, search]
  );

  const itemsQuery = useInventoryItems(params);
  const movementsQuery = useInventoryMovements(params);
  const recipesQuery = useInventoryRecipes(params);
  const categoriesQuery = useInventoryCategories(params);
  const createMovement = useCreateInventoryMovement();

  const rows = normalizeRows(
    activeTab === "items"
      ? itemsQuery.data
      : activeTab === "movements"
      ? movementsQuery.data
      : activeTab === "recipes"
      ? recipesQuery.data
      : categoriesQuery.data
  );

  const isLoading =
    loading ||
    (activeTab === "items"
      ? itemsQuery.isLoading || itemsQuery.isFetching
      : activeTab === "movements"
      ? movementsQuery.isLoading || movementsQuery.isFetching
      : activeTab === "recipes"
      ? recipesQuery.isLoading || recipesQuery.isFetching
      : categoriesQuery.isLoading || categoriesQuery.isFetching);

  const handleCreateMovement = () => {
    if (!restaurantId || !branchId || !movement.itemId || !movement.quantity) return;

    createMovement.mutate(
      {
        restaurantId,
        branchId,
        itemId: movement.itemId,
        type: movement.type,
        quantity: Number(movement.quantity),
        reason: movement.reason || undefined,
      },
      {
        onSuccess: () => {
          setMovement({ itemId: "", type: "ADJUSTMENT", quantity: "", reason: "" });
          setActiveTab("movements");
        },
      }
    );
  };

  return (
    <Container>
      <Header
        title={isBranchAdmin ? "Branch Inventory" : "Inventory"}
        description={
          isBranchAdmin
            ? "View branch stock, recipes, categories, and record stock movements for your assigned branch."
            : "View inventory and stock movements."
        }
      />

      {!branchId ? (
        <div className="rounded-[16px] border border-amber-200 bg-amber-50 p-5 text-sm text-amber-700">
          No assigned branch was found in your session. Please login again with a branch-admin account.
        </div>
      ) : null}

      <div className="mt-6 rounded-[20px] bg-white p-5 shadow-sm">
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {inventoryTabs.map(({ key, label }) => (
              <Button
                key={key}
                type="button"
                variant={activeTab === key ? "default" : "outline"}
                onClick={() => setActiveTab(key)}
                className="rounded-[12px]"
              >
                {label}
              </Button>
            ))}
          </div>

          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search inventory..."
            className="h-[44px] max-w-[360px] rounded-[14px]"
          />
        </div>

        <div className="mb-6 rounded-[16px] border border-gray-100 bg-gray-50 p-4">
          <h3 className="mb-3 text-sm font-semibold text-gray-800">Record stock movement</h3>
          <div className="grid gap-3 md:grid-cols-4">
            <Input
              value={movement.itemId}
              onChange={(event) =>
                setMovement((prev) => ({ ...prev, itemId: event.target.value }))
              }
              placeholder="Inventory item ID"
              className="h-[42px] rounded-[12px]"
            />
            <select
              value={movement.type}
              onChange={(event) =>
                setMovement((prev) => ({ ...prev, type: event.target.value as any }))
              }
              className="h-[42px] rounded-[12px] border border-gray-200 bg-white px-3 text-sm"
            >
              <option value="IN">IN</option>
              <option value="OUT">OUT</option>
              <option value="ADJUSTMENT">ADJUSTMENT</option>
            </select>
            <Input
              type="number"
              value={movement.quantity}
              onChange={(event) =>
                setMovement((prev) => ({ ...prev, quantity: event.target.value }))
              }
              placeholder="Quantity"
              className="h-[42px] rounded-[12px]"
            />
            <Input
              value={movement.reason}
              onChange={(event) =>
                setMovement((prev) => ({ ...prev, reason: event.target.value }))
              }
              placeholder="Reason / note"
              className="h-[42px] rounded-[12px]"
            />
          </div>
          <Button
            type="button"
            onClick={handleCreateMovement}
            disabled={createMovement.isPending || !branchId}
            className="mt-3 rounded-[12px]"
          >
            {createMovement.isPending ? "Saving..." : "Save movement"}
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="py-3 pr-3">Name / Reference</th>
                <th className="py-3 pr-3">Category / Type</th>
                <th className="py-3 pr-3">Quantity</th>
                <th className="py-3 pr-3">Status / Updated</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                loadingRows.map((key) => (
                  <tr key={key}>
                    <td colSpan={4} className="py-4">
                      <div className="h-8 animate-pulse rounded bg-gray-100" />
                    </td>
                  </tr>
                ))
              ) : rows.length ? (
                rows.map((row: any) => {
                  const {
                    id,
                    _id,
                    name,
                    item,
                    reference,
                    category,
                    type,
                    movementType,
                    quantity,
                    currentStock,
                    stock,
                    status,
                    updatedAt,
                    createdAt,
                  } = row;
                  const displayName = name?.trim() || item?.name?.trim() || reference?.trim() || id || "-";
                  const displayCategory = category?.name?.trim() || type || movementType || "-";
                  const displayStatus = status || updatedAt || createdAt || "-";

                  return (
                  <tr key={id ?? _id ?? name} className="border-b last:border-0">
                    <td className="py-3 pr-3 font-medium text-gray-900">
                      {displayName}
                    </td>
                    <td className="py-3 pr-3 text-gray-600">
                      {displayCategory}
                    </td>
                    <td className="py-3 pr-3 text-gray-600">
                      {quantity ?? currentStock ?? stock ?? "-"}
                    </td>
                    <td className="py-3 pr-3 text-gray-600">
                      {displayStatus}
                    </td>
                  </tr>
                );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-gray-400">
                    No inventory records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Container>
  );
}
