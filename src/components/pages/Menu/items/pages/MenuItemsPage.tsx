"use client";

import { useState } from "react";
import Container from "@/components/common/Container";
import Header from "@/components/common/PageHeader";
import MenuItemsTable from "@/components/pages/Menu/items/components/MenuItemsTable/MenuItemsTable";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import CreateMenuItemModal from "@/components/pages/Menu/items/components/CreateMenuItemModal/CreateMenuItemModal";

const MenuItemsPage = () => {
  const { isBranchAdmin } = useAuth();
  const [open, setOpen] = useState(false);
  const [refetchKey, setRefetchKey] = useState(0);

  const handleSuccess = () => {
    setRefetchKey((prev) => prev + 1); //  trigger refetch
  };

  return (
    <Container>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between w-full">
        <Header
          title={isBranchAdmin ? "Menu Item Branch Overrides" : "Menu Items"}
          description={
            isBranchAdmin
              ? "Adjust item availability and branch-specific prices for your assigned branch"
              : "Manage menu items from here"
          }
        />

        {!isBranchAdmin ? (
        <Button
          onClick={() => setOpen(true)}
          className="h-[44px] rounded-[14px] px-5 flex items-center gap-2 bg-primary hover:bg-red-700 text-white text-[15px] font-[500] shadow-md"
        >
          <PlusCircle size={18} />
          Add Menu Item
        </Button>
        ) : null}
      </div>

      <div className="bg-white p-6 rounded-[20px] shadow-sm mt-6">
        <MenuItemsTable refetchKey={refetchKey} />
      </div>

      {/*  GLOBAL MODAL */}
      <CreateMenuItemModal
        open={open}
        onOpenChange={setOpen}
        onSuccess={handleSuccess}
      />
    </Container>
  );
};

export default MenuItemsPage;