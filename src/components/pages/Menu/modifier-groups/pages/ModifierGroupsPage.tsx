"use client";

import Container from "@/components/common/Container";
import Header from "@/components/common/PageHeader";
import ModifierGroupsTable from "@/components/pages/Menu/modifier-groups/components/ModifierGroupsTable/ModifierGroupsTable";
import { useTranslations } from "next-intl";

const ModifierGroupsPage = () => {
  const t = useTranslations("menu");

  return (
    <Container>
      <Header
        title={t("modifierGroupsTitle")}
        description={t("modifierGroupsDescription")}
      />

      <div className="bg-white p-6 rounded-[20px] shadow-sm mt-6">
        <ModifierGroupsTable />
      </div>
    </Container>
  );
};

export default ModifierGroupsPage;
