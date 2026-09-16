"use client";

import ModifierCategoriesTable from "@/components/pages/Menu/modifier-categories/components/ModifierCategoriesTable";
import { MenuManagementPage } from "@/components/pages/Menu/shared/MenuManagementPage";

export default function ModifierCategoriesPage() {
  return (
    <MenuManagementPage
      title="Modifier Categories"
      description="Create categories such as Bread, Sauces, Cheese, and Toppings."
    >
      <ModifierCategoriesTable />
    </MenuManagementPage>
  );
}
