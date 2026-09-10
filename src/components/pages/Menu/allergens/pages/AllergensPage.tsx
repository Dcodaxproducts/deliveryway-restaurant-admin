"use client";

import Container from "@/components/common/Container";
import Header from "@/components/common/PageHeader";
import AllergenTable from "@/components/pages/Menu/allergens/components/AllergenTable/AllergenTable";
import { useTranslations } from "next-intl";
import { SectionCard } from "@/components/common/SectionCard";

const AllergenPage = () => {
  const t = useTranslations("menu");

  return (
    <Container>
      <Header
        title={t("allergensTitle")}
        description={t("allergensDescription")}
      />

      <SectionCard padding="md">
        <AllergenTable />
      </SectionCard>
    </Container>
  );
};

export default AllergenPage;
