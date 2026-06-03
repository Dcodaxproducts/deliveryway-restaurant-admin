"use client";

import Container from "@/components/common/Container";
import Header from "@/components/common/PageHeader";
import VariationsTable from "@/components/pages/Menu/variations/components/VariationsTable/VariationsTable";
import { useTranslations } from "next-intl";

const ModifierGroupsPage = () => {
  const t = useTranslations("menu");

  return (
    <Container>
      <Header
        title={t("variations")}
        description={t("variationsDescription")}
      />

      <div className="bg-white p-6 rounded-[20px] shadow-sm mt-6">
        <VariationsTable />
      </div>
    </Container>
  );
};

export default ModifierGroupsPage;
