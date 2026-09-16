"use client";

import { useState } from "react";
import MenuItemsTable from "@/components/pages/Menu/items/components/MenuItemsTable/MenuItemsTable";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import CreateMenuItemModal from "@/components/pages/Menu/items/components/CreateMenuItemModal/CreateMenuItemModal";
import { useTranslations } from "next-intl";
import { MenuManagementPage } from "@/components/pages/Menu/shared/MenuManagementPage";

const MenuItemsPage = () => {
  const { isBranchAdmin } = useAuth();
  const t = useTranslations("menu");
  const [open, setOpen] = useState(false);
  const [refetchKey, setRefetchKey] = useState(0);

  const handleSuccess = () => {
    setRefetchKey((prev) => prev + 1); //  trigger refetch
  };

  return (
    <>
      <MenuManagementPage
        title={isBranchAdmin ? t("menuItemBranchOverrides") : t("itemsTitle")}
        description={
          isBranchAdmin
            ? t("menuItemBranchOverridesDescription")
            : t("itemsDescription")
        }
        actions={
          !isBranchAdmin ? (
            <Button
              onClick={() => setOpen(true)}
              className="h-10 px-4 shadow-[var(--ui-shadow-xs)]"
            >
              <PlusCircle aria-hidden="true" size={17} />
              {t("addMenuItem")}
            </Button>
          ) : undefined
        }
      >
        <MenuItemsTable refetchKey={refetchKey} />
      </MenuManagementPage>

      <CreateMenuItemModal
        open={open}
        onOpenChange={setOpen}
        onSuccess={handleSuccess}
      />
    </>
  );
};

export default MenuItemsPage;
