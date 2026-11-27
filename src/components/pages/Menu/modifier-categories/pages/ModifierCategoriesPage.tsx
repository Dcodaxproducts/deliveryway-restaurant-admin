"use client";


import { getLocalizedMessage } from "@/lib/localized-message";
import Container from "@/components/common/Container";
import Header from "@/components/common/PageHeader";
import ModifierCategoriesTable from "@/components/pages/Menu/modifier-categories/components/ModifierCategoriesTable";

export default function ModifierCategoriesPage() {
  return (
    <Container>
      <Header
        title={getLocalizedMessage("message216")}
        description="Create categories such as Bread, Sauces, Cheese, and Toppings."
      />

      <div className="mt-6 rounded-[20px] bg-white p-6 shadow-sm">
        <ModifierCategoriesTable />
      </div>
    </Container>
  );
}
