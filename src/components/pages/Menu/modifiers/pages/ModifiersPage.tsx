"use client";

import ModifiersTable from "@/components/pages/Menu/modifiers/components/ModifiersTable/ModifiersTable";
import { useTranslations } from "next-intl";
import { MenuManagementPage } from "@/components/pages/Menu/shared/MenuManagementPage";

const ModifiersPage = () => {
  const t = useTranslations("menu");

  return (
    <MenuManagementPage
      title={t("modifiersTitle")}
      description={t("modifiersDescription")}
    >
      <ModifiersTable />
    </MenuManagementPage>
  );
};

export default ModifiersPage;
