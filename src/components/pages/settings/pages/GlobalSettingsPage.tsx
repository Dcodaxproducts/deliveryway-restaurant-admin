"use client";

import Container from "@/components/common/Container";
import PageHeader from "@/components/common/PageHeader";
import { SettingsLayout } from "@/components/common/SettingsLayout";
import SettingsForm from "@/components/pages/Settings/forms/SettingsForm";
import { useTranslations } from "next-intl";

const SettingsPage = () => {
  const t = useTranslations("settings");

  return (
    <Container>
      <PageHeader
        title={t("globalSettingsTitle")}
        description={t("globalSettingsDescription")}
      />
      <SettingsLayout>
        <SettingsForm />
      </SettingsLayout>
    </Container>
  );
};

export default SettingsPage;
