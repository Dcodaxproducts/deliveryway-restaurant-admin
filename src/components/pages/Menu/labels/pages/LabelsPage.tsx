"use client";

import Container from "@/components/common/Container";
import Header from "@/components/common/PageHeader";
import LabelsTable from "@/components/pages/Menu/labels/components/LabelsTable/LabelsTable";

const LabelsPage = () => {
  return (
    <Container>
      <Header
        title="Menu Item Labels"
        description="Create and manage reusable labels for menu items, such as Vegan, Spicy, Popular, or New."
      />

      <div className="mt-6 rounded-[20px] bg-white p-6 shadow-sm">
        <LabelsTable />
      </div>
    </Container>
  );
};

export default LabelsPage;