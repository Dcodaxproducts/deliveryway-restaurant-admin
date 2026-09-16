"use client";

import AllergenTable from "@/components/pages/Menu/allergens/components/AllergenTable/AllergenTable";
import { useTranslations } from "next-intl";
import { MenuManagementPage } from "@/components/pages/Menu/shared/MenuManagementPage";

const AllergenPage = () => {
  const t = useTranslations("menu");

  return (
    <MenuManagementPage
      title={t("allergensTitle")}
      description={t("allergensDescription")}
    >
      <AllergenTable />
    </MenuManagementPage>
  );
};

export default AllergenPage;
