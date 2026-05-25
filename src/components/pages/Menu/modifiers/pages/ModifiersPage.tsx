"use client";

import Container from "@/components/container";
import Header from "@/components/header";
import ModifiersTable from "@/components/pages/Menu/modifiers/components/ModifiersTable/ModifiersTable";

const ModifiersPage = () => {
  return (
    <Container>
      <Header
        title="Modifiers"
        description="Manage item modifiers"
      />

      <div className="bg-white p-6 rounded-[20px] shadow-sm mt-6">
        <ModifiersTable />
      </div>
    </Container>
  );
};

export default ModifiersPage;