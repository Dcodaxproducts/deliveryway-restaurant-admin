"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import CategoriesTable from "@/components/pages/Menu/categories/components/CategoriesTable/CategoriesTable";
import CreateCategoryModalParent from "@/components/pages/Menu/legacy/root-menu-components/listing/CreateCategoryModalParent";
import { useTranslations } from "next-intl";
import { MenuManagementPage } from "@/components/pages/Menu/shared/MenuManagementPage";

const MenuCategoriesPage = () => {
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
        title={isBranchAdmin ? t("categoryBranchOverrides") : t("categoriesTitle")}
        description={
          isBranchAdmin
            ? t("categoryBranchOverridesDescription")
            : t("categoriesDescription")
        }
        actions={
          !isBranchAdmin ? (
            <Button
              onClick={() => setOpen(true)}
              className="h-10 px-4 shadow-[var(--ui-shadow-xs)]"
            >
              <PlusCircle aria-hidden="true" size={17} />
              {t("addCategories")}
            </Button>
          ) : undefined
        }
      >
        <CategoriesTable refetchKey={refetchKey} />
      </MenuManagementPage>

      <CreateCategoryModalParent
        open={open}
        onOpenChange={setOpen}
        onSuccess={handleSuccess}
      />
    </>
  );
};

export default MenuCategoriesPage;
