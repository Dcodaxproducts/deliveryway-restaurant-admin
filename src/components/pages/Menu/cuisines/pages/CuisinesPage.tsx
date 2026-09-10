"use client";

import Container from "@/components/common/Container";
import Header from "@/components/common/PageHeader";
import CuisinesTable from "@/components/pages/Menu/cuisines/components/CuisinesTable";
import { SectionCard } from "@/components/common/SectionCard";

export default function CuisinesPage() {
  return (
    <Container>
      <Header
        title="Cuisines"
        description="View global cuisine tags available for menu items."
      />

      <SectionCard padding="md">
        <CuisinesTable />
      </SectionCard>
    </Container>
  );
}
