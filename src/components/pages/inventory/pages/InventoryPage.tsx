"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import Container from "@/components/common/Container";
import type { DataTableColumn } from "@/components/common/DataTable";
import { StatePanel } from "@/components/common/EmptyState";
import { FilterBar } from "@/components/common/FilterBar";
import Header from "@/components/common/PageHeader";
import { ResponsiveDataView } from "@/components/common/ResponsiveDataView";
import { SectionCard } from "@/components/common/SectionCard";
import { StatusBadge } from "@/components/common/status-badge";
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
type MovementType = "IN" | "OUT" | "ADJUSTMENT";

type InventoryRow = {
  key: string;
  name: string;
  category: string;
  quantity: string | number;
  status: string;
};

const inventoryTabs: { key: InventoryTab; label: string }[] = [
  { key: "items", label: "Items" },
  { key: "movements", label: "Movements" },
  { key: "recipes", label: "Recipes" },
  { key: "categories", label: "Categories" },
];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const getText = (value: unknown) =>
  typeof value === "string" && value.trim() ? value.trim() : undefined;

const getRowsSource = (response: unknown): unknown[] => {
  if (Array.isArray(response)) return response;
  if (!isRecord(response)) return [];

  if (Array.isArray(response.data)) return response.data;
  if (Array.isArray(response.items)) return response.items;
  if (isRecord(response.data)) {
    if (Array.isArray(response.data.items)) return response.data.items;
    if (Array.isArray(response.data.data)) return response.data.data;
  }

  return [];
};

const normalizeRows = (response: unknown): InventoryRow[] =>
  getRowsSource(response).flatMap((value, index) => {
    if (!isRecord(value)) return [];

    const item = isRecord(value.item) ? value.item : undefined;
    const category = isRecord(value.category) ? value.category : undefined;
    const identity =
      getText(value.id) ?? getText(value._id) ?? getText(value.name) ?? `inventory-${index}`;
    const quantity = value.quantity ?? value.currentStock ?? value.stock ?? "—";

    return [{
      key: identity,
      name:
        getText(value.name) ?? getText(item?.name) ?? getText(value.reference) ?? identity,
      category:
        getText(category?.name) ?? getText(value.type) ?? getText(value.movementType) ?? "—",
      quantity: typeof quantity === "string" || typeof quantity === "number" ? quantity : "—",
      status:
        getText(value.status) ?? getText(value.updatedAt) ?? getText(value.createdAt) ?? "—",
    }];
  });

const columns: DataTableColumn<InventoryRow>[] = [
  {
    id: "name",
    header: "Name / reference",
    cell: (row) => <span className="font-semibold text-[var(--ui-text)]">{row.name}</span>,
  },
  { id: "category", header: "Category / type", cell: (row) => row.category },
  {
    id: "quantity",
    header: "Quantity",
    align: "right",
    cell: (row) => <span className="font-medium tabular-nums">{row.quantity}</span>,
  },
  {
    id: "status",
    header: "Status / updated",
    cell: (row) => <StatusBadge>{row.status}</StatusBadge>,
  },
];

export default function InventoryPage() {
  const feedbackT = useTranslations("common.feedback");
  const { restaurantId, branchId, isBranchAdmin, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<InventoryTab>("items");
  const [search, setSearch] = useState("");
  const [movement, setMovement] = useState({
    itemId: "",
    type: "ADJUSTMENT" as MovementType,
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
    [restaurantId, branchId, search],
  );

  const itemsQuery = useInventoryItems(params);
  const movementsQuery = useInventoryMovements(params);
  const recipesQuery = useInventoryRecipes(params);
  const categoriesQuery = useInventoryCategories(params);
  const createMovement = useCreateInventoryMovement();
  const activeQuery =
    activeTab === "items"
      ? itemsQuery
      : activeTab === "movements"
        ? movementsQuery
        : activeTab === "recipes"
          ? recipesQuery
          : categoriesQuery;
  const rows = normalizeRows(activeQuery.data);
  const isLoading = !activeQuery.data && (loading || activeQuery.isLoading || activeQuery.isFetching);
  const error = activeQuery.isError ? feedbackT("loadFailedDescription") : null;

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
      },
    );
  };

  return (
    <Container>
      <Header
        eyebrow="Operations"
        title={isBranchAdmin ? "Branch inventory" : "Inventory"}
        description={
          isBranchAdmin
            ? "View branch stock, recipes, categories, and record stock movements for your assigned branch."
            : "Track stock, movements, recipes, and inventory categories."
        }
      />

      {!loading && (!restaurantId || !branchId) ? (
        <StatePanel
          state="unavailable"
          title={feedbackT("unavailable", { subject: feedbackT("subjects.inventoryContext") })}
          description={feedbackT("inventoryContextRequired")}
          compact
        />
      ) : null}

      <SectionCard padding="md" className="space-y-5">
        <FilterBar
          search={
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search inventory"
              aria-label="Search inventory"
              className="h-11"
            />
          }
          filters={
            <div className="flex flex-wrap gap-2" role="tablist" aria-label="Inventory view">
              {inventoryTabs.map(({ key, label }) => (
                <Button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === key}
                  variant={activeTab === key ? "default" : "ghost"}
                  onClick={() => setActiveTab(key)}
                  className="min-h-10"
                >
                  {label}
                </Button>
              ))}
            </div>
          }
          resultCount={activeQuery.data ? `${rows.length} record${rows.length === 1 ? "" : "s"}` : undefined}
        />

        <SectionCard
          variant="outlined"
          padding="sm"
          title="Record stock movement"
          description="Add an inventory adjustment for the active branch."
        >
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Input
              value={movement.itemId}
              onChange={(event) => setMovement((prev) => ({ ...prev, itemId: event.target.value }))}
              placeholder="Inventory item ID"
              aria-label="Inventory item ID"
            />
            <select
              value={movement.type}
              onChange={(event) =>
                setMovement((prev) => ({ ...prev, type: event.target.value as MovementType }))
              }
              aria-label="Movement type"
              className="h-11 rounded-[var(--ui-radius-control)] border border-[var(--ui-border)] bg-[var(--ui-surface)] px-3 text-sm"
            >
              <option value="IN">In</option>
              <option value="OUT">Out</option>
              <option value="ADJUSTMENT">Adjustment</option>
            </select>
            <Input
              type="number"
              value={movement.quantity}
              onChange={(event) => setMovement((prev) => ({ ...prev, quantity: event.target.value }))}
              placeholder="Quantity"
              aria-label="Quantity"
            />
            <Input
              value={movement.reason}
              onChange={(event) => setMovement((prev) => ({ ...prev, reason: event.target.value }))}
              placeholder="Reason or note"
              aria-label="Reason or note"
            />
          </div>
          <Button
            type="button"
            onClick={handleCreateMovement}
            disabled={createMovement.isPending || !branchId}
            className="mt-4"
          >
            {createMovement.isPending ? "Saving…" : "Save movement"}
          </Button>
        </SectionCard>

        {error && activeQuery.data ? (
          <StatePanel state="error" title={feedbackT("refreshFailed", { subject: feedbackT("subjects.inventory") })} description={feedbackT("cachedDescription")} compact />
        ) : null}
        {loading ? (
          <StatePanel state="loading" title={feedbackT("loading", { subject: feedbackT("subjects.inventory") })} description={feedbackT("inventoryContextLoading")} compact />
        ) : restaurantId && branchId ? <ResponsiveDataView
          data={rows}
          columns={columns}
          rowKey={(row) => row.key}
          loading={isLoading}
          error={!activeQuery.data ? error : null}
          errorTitle={feedbackT("loadFailed", { subject: feedbackT("subjects.inventory") })}
          emptyTitle="No inventory records found"
          emptyDescription="Try another tab or search term."
          caption={`${activeTab} inventory records`}
          renderMobileItem={(row) => (
            <article className="rounded-[var(--ui-radius-card)] border border-[var(--ui-border)] bg-[var(--ui-surface)] p-4 shadow-[var(--ui-shadow-xs)]">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate font-semibold text-[var(--ui-text)]">{row.name}</h3>
                  <p className="mt-1 text-sm text-[var(--ui-text-muted)]">{row.category}</p>
                </div>
                <StatusBadge>{row.status}</StatusBadge>
              </div>
              <p className="mt-4 text-sm text-[var(--ui-text-muted)]">
                Quantity <span className="ml-1 font-semibold tabular-nums text-[var(--ui-text)]">{row.quantity}</span>
              </p>
            </article>
          )}
        /> : null}
        {error && restaurantId && branchId ? <Button type="button" variant="outline" disabled={activeQuery.isFetching || loading} onClick={() => void activeQuery.refetch()}>{feedbackT("retry", { subject: feedbackT("subjects.inventory") })}</Button> : null}
      </SectionCard>
    </Container>
  );
}
