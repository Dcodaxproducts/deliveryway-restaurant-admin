"use client";

import Container from "@/components/common/Container";
import Header from "@/components/common/PageHeader";
import LabelsTable from "@/components/pages/Menu/labels/components/LabelsTable/LabelsTable";
import { useTranslations } from "next-intl";

const LabelsPage = () => {
  const t = useTranslations("menu");

  return (
    <Container>
      <Header
        title={t("labelsTitleLong")}
        description={t("labelsDescriptionLong")}
      />

      <div className="mt-6 rounded-[20px] bg-white p-6 shadow-sm">
        <LabelsTable />
      </div>
    </Container>
  );
};

export default LabelsPage;
