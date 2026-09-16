"use client";

import VariationsTable from "@/components/pages/Menu/variations/components/VariationsTable/VariationsTable";
import { useTranslations } from "next-intl";
import { MenuManagementPage } from "@/components/pages/Menu/shared/MenuManagementPage";

const ModifierGroupsPage = () => {
  const t = useTranslations("menu");

  return (
    <MenuManagementPage
      title={t("variations")}
      description={t("variationsDescription")}
    >
      <VariationsTable />
    </MenuManagementPage>
  );
};

export default ModifierGroupsPage;
