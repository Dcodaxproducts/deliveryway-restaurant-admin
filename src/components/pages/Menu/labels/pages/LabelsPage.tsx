"use client";

import Container from "@/components/common/Container";
import Header from "@/components/common/PageHeader";
import LabelsTable from "@/components/pages/Menu/labels/components/LabelsTable/LabelsTable";
import { useTranslations } from "next-intl";
import { SectionCard } from "@/components/common/SectionCard";

const LabelsPage = () => {
  const t = useTranslations("menu");

  return (
    <Container>
      <Header
        title={t("labelsTitleLong")}
        description={t("labelsDescriptionLong")}
      />

      <SectionCard padding="md">
        <LabelsTable />
      </SectionCard>
    </Container>
  );
};

export default LabelsPage;
