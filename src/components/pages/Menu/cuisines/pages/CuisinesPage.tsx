"use client";

import Container from "@/components/common/Container";
import Header from "@/components/common/PageHeader";
import CuisinesTable from "@/components/pages/Menu/cuisines/components/CuisinesTable";

export default function CuisinesPage() {
  return (
    <Container>
      <Header
        title="Cuisines"
        description="Manage cuisine tags used to organize menu items."
      />

      <div className="mt-6 rounded-[20px] bg-white p-6 shadow-sm">
        <CuisinesTable />
      </div>
    </Container>
  );
}
