"use client";

import Container from "@/components/common/Container";
import Header from "@/components/common/PageHeader";
import ModifiersTable from "@/components/pages/Menu/modifiers/components/ModifiersTable/ModifiersTable";
import { useTranslations } from "next-intl";
import { SectionCard } from "@/components/common/SectionCard";

const ModifiersPage = () => {
  const t = useTranslations("menu");

  return (
    <Container>
      <Header
        title={t("modifiersTitle")}
        description={t("modifiersDescription")}
      />

      <SectionCard padding="md">
        <ModifiersTable />
      </SectionCard>
    </Container>
  );
};

export default ModifiersPage;
