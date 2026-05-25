"use client";

import Container from "@/components/container";
import Header from "@/components/header";
import AllergenTable from "@/components/pages/Menu/allergens/components/AllergenTable/AllergenTable";

const AllergenPage = () => {
  return (
    <Container>
      <Header
        title="Allergen & Additive"
        description="Create and manage reusable allergen and additive templates for menu items."
      />

      <div className="mt-6 rounded-[20px] bg-white p-6 shadow-sm">
        <AllergenTable />
      </div>
    </Container>
  );
};

export default AllergenPage;