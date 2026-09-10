"use client";

import Container from "@/components/common/Container";
import Header from "@/components/common/PageHeader";
import { ModifierGroupsTable } from "@/components/pages/Menu/modifier-groups/components/ModifierGroupsTable/ModifierGroupsTable";
import { useTranslations } from "next-intl";
import { SectionCard } from "@/components/common/SectionCard";

export function ModifierGroupsPage() {
  const t = useTranslations("menu");

  return (
    <Container>
      <Header
        title={t("modifierGroupsTitle")}
        description={t("modifierGroupsDescription")}
      />

      <SectionCard padding="md">
        <ModifierGroupsTable />
      </SectionCard>
    </Container>
  );
}
