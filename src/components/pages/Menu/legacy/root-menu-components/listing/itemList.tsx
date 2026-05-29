"use client";

import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import MenuItemCard from "@/components/cards/MenuItemCard";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import CreateMenuItemModal from "../CreateMenuItemModal/CreateMenuItemModal";

interface ItemListProps {
  editing?: boolean;
  items: any[];
  loading?: boolean;
  showAddNew?: boolean;
  headerText?: string;
  addNewText?: string;
  refetch?: () => void;
}

export default function ItemList({
  editing,
  items,
  loading,
  showAddNew = true,
  headerText = "Item List",
  addNewText = "Add New Item",
  refetch
}: ItemListProps) {
  const [createMenuItem, setCreateMenuItem] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const pathname = usePathname();
  const isPOS = pathname?.includes("/pos");
  const { isBranchAdmin } = useAuth();
  const canManageItems = !isBranchAdmin;

  const gridCols = isPOS
    ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3"
    : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4";

  return (
    <div className="w-full py-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[24px] font-semibold text-gray-900">
          {headerText}
        </h2>

        {showAddNew && (
          <Button
            variant="link"
            size="sm"
            className="inline-flex items-center gap-2 text-primary font-semibold text-[16px]"
            onClick={() => setCreateMenuItem(true)}
          >
            <PlusCircle className="w-4 h-4" />
            {addNewText}
          </Button>
        )}
      </div>

      {/* ITEMS */}
      {loading ? (
        <div className="flex flex-wrap justify-center gap-3 lg:justify-start">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="w-full sm:w-[260px] h-[260px] bg-white rounded-[22px] border border-gray-200 p-4 animate-pulse"
            >
              <div className="w-full h-[120px] bg-gray-200 rounded-lg mb-4" />
              <div className="h-4 w-3/4 bg-gray-200 rounded mb-2" />
              <div className="h-3 w-1/2 bg-gray-200 rounded mb-3" />
              <div className="h-3 w-1/4 bg-gray-200 rounded mb-4" />
              <div className="flex items-center justify-between">
                <div className="h-5 w-1/4 bg-gray-200 rounded" />
                <div className="h-10 w-10 bg-gray-200 rounded-[10px]" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center w-full py-16 border border-dashed border-gray-200 rounded-[16px] bg-gray-50">
          <div className="w-16 h-16 flex items-center justify-center rounded-full bg-white shadow mb-4">
            <PlusCircle className="w-8 h-8 text-primary" />
          </div>

          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            No items yet
          </h3>

          <p className="text-sm text-gray-500 mb-4 text-center max-w-[300px]">
            You haven’t added any menu items in this category.
          </p>

          {showAddNew && (
            <Button
              className="bg-primary hover:bg-red-600 text-white rounded-[10px] px-5"
              onClick={() => setCreateMenuItem(true)}
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              {addNewText}
            </Button>
          )}
        </div>
      ) : (
        <div className={`grid ${gridCols} gap-4`}>
          {items.map((item) => (
            <MenuItemCard
              key={item.id}
              item={item}
              editing={canManageItems}
              onEdit={() => {
                setSelectedItem(item);
                setCreateMenuItem(true);
              }}
              onDelete={refetch}
            />
          ))}
        </div>
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
    </div>
  );
}
