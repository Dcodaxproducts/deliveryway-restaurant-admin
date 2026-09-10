"use client";

import Container from "@/components/common/Container";
import Header from "@/components/common/PageHeader";
import VariationsTable from "@/components/pages/Menu/variations/components/VariationsTable/VariationsTable";
import { useTranslations } from "next-intl";
import { SectionCard } from "@/components/common/SectionCard";

const ModifierGroupsPage = () => {
  const t = useTranslations("menu");

  return (
    <Container>
      <Header
        title={t("variations")}
        description={t("variationsDescription")}
      />

      <SectionCard padding="md">
        <VariationsTable />
      </SectionCard>
    </Container>
  );
};

export default ModifierGroupsPage;
