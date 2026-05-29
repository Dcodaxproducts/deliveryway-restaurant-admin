"use client";

import Container from "@/components/common/Container";
import Header from "@/components/common/PageHeader";
import VariationsTable from "@/components/pages/Menu/variations/components/VariationsTable/VariationsTable";

const ModifierGroupsPage = () => {
  return (
    <Container>
      <Header
        title="Menu Variations"
        description="Manage menu variations"
      />

      <div className="bg-white p-6 rounded-[20px] shadow-sm mt-6">
        <VariationsTable />
      </div>
    </Container>
  );
};

export default ModifierGroupsPage;