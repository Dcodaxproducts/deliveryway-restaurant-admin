"use client";

import Container from "@/components/common/Container";
import Header from "@/components/common/PageHeader";
import ModifiersTable from "@/components/pages/Menu/modifiers/components/ModifiersTable/ModifiersTable";
import { useTranslations } from "next-intl";

const ModifiersPage = () => {
  const t = useTranslations("menu");

  return (
    <Container>
      <Header
        title={t("modifiersTitle")}
        description={t("modifiersDescription")}
      />

      <div className="bg-white p-6 rounded-[20px] shadow-sm mt-6">
        <ModifiersTable />
      </div>
    </Container>
  );
};

export default ModifiersPage;
