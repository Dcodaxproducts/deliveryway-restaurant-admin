"use client";

import { useState } from "react";
import Container from "@/components/common/Container";
import Header from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import CategoriesTable from "@/components/pages/Menu/categories/components/CategoriesTable/CategoriesTable";
import CreateCategoryModalParent from "@/components/pages/Menu/legacy/root-menu-components/listing/CreateCategoryModalParent";
import { useTranslations } from "next-intl";

const MenuCategoriesPage = () => {
  const { isBranchAdmin } = useAuth();
  const t = useTranslations("menu");
  const [open, setOpen] = useState(false);
  const [refetchKey, setRefetchKey] = useState(0);

  const handleSuccess = () => {
    setRefetchKey((prev) => prev + 1); //  trigger refetch
  };

  return (
    <Container>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between w-full">
        <Header
          title={isBranchAdmin ? t("categoryBranchOverrides") : t("categoriesTitle")}
          description={
            isBranchAdmin
              ? t("categoryBranchOverridesDescription")
              : t("categoriesDescription")
          }
        />

        {!isBranchAdmin ? (
        <Button
          onClick={() => setOpen(true)}
          className="h-[44px] rounded-[14px] px-5 flex items-center gap-2 bg-primary hover:bg-red-700 text-white text-[15px] font-[500] shadow-md"
        >
          <PlusCircle size={18} />
          {t("addCategories")}
        </Button>
        ) : null}
      </div>

      <div className="bg-white p-6 rounded-[20px] shadow-sm mt-6">
        <CategoriesTable refetchKey={refetchKey} />
      </div>

      {/*  GLOBAL MODAL */}
      <CreateCategoryModalParent
        open={open}
        onOpenChange={setOpen}
        onSuccess={handleSuccess}
      />
    </Container>
  );
};

export default MenuCategoriesPage;
