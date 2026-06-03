"use client";

import Container from "@/components/common/Container";
import Header from "@/components/common/PageHeader";
import AllergenTable from "@/components/pages/Menu/allergens/components/AllergenTable/AllergenTable";
import { useTranslations } from "next-intl";

const AllergenPage = () => {
  const t = useTranslations("menu");

  return (
    <Container>
      <Header
        title={t("allergensTitle")}
        description={t("allergensDescription")}
      />

      <div className="mt-6 rounded-[20px] bg-white p-6 shadow-sm">
        <AllergenTable />
      </div>
    </Container>
  );
};

export default AllergenPage;
