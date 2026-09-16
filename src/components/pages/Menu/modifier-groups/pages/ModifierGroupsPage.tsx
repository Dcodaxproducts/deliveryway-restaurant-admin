"use client";

import { ModifierGroupsTable } from "@/components/pages/Menu/modifier-groups/components/ModifierGroupsTable/ModifierGroupsTable";
import { useTranslations } from "next-intl";
import { MenuManagementPage } from "@/components/pages/Menu/shared/MenuManagementPage";

export function ModifierGroupsPage() {
  const t = useTranslations("menu");

  return (
    <MenuManagementPage
      title={t("modifierGroupsTitle")}
      description={t("modifierGroupsDescription")}
    >
      <ModifierGroupsTable />
    </MenuManagementPage>
  );
}
