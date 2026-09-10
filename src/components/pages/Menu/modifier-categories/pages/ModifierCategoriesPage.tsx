"use client";

import Container from "@/components/common/Container";
import Header from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import ModifierCategoriesTable from "@/components/pages/Menu/modifier-categories/components/ModifierCategoriesTable";

export default function ModifierCategoriesPage() {
  return (
    <Container>
      <Header
        title="Modifier Categories"
        description="Create categories such as Bread, Sauces, Cheese, and Toppings."
      />

      <SectionCard padding="md">
        <ModifierCategoriesTable />
      </SectionCard>
    </Container>
  );
}
