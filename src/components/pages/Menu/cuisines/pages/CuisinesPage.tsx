"use client";

import CuisinesTable from "@/components/pages/Menu/cuisines/components/CuisinesTable";
import { StatusBadge } from "@/components/common/status-badge";
import { MenuManagementPage } from "@/components/pages/Menu/shared/MenuManagementPage";
import { useTranslations } from "next-intl";

export default function CuisinesPage() {
  const t = useTranslations("common");

  return (
    <MenuManagementPage
      title={t("cuisines")}
      description={t("cuisinesDescription")}
      actions={<StatusBadge tone="neutral">{t("readOnly")}</StatusBadge>}
    >
      <CuisinesTable />
    </MenuManagementPage>
  );
}
