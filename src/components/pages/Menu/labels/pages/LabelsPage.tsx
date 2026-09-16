"use client";

import LabelsTable from "@/components/pages/Menu/labels/components/LabelsTable/LabelsTable";
import { useTranslations } from "next-intl";
import { MenuManagementPage } from "@/components/pages/Menu/shared/MenuManagementPage";

const LabelsPage = () => {
  const t = useTranslations("menu");

  return (
    <MenuManagementPage
      title={t("labelsTitleLong")}
      description={t("labelsDescriptionLong")}
    >
      <LabelsTable />
    </MenuManagementPage>
  );
};

export default LabelsPage;
