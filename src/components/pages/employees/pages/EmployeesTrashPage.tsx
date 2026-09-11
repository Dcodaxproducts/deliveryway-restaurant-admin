"use client";

import Link from "next/link";
import Container from "@/components/common/Container";
import { StatePanel } from "@/components/common/EmptyState";
import Header from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { SectionCard } from "@/components/common/SectionCard";

const EmployeeTrashPage = () => {
  const feedbackT = useTranslations("common.feedback");
  const t = useTranslations("employees");

  return (
    <Container>
      <Header title={t("trashTitle")} />
      <SectionCard padding="md">
        <StatePanel
          state="unavailable"
          title={feedbackT("unavailable", { subject: t("trashTitle") })}
          description={feedbackT("trashUnavailableDescription")}
          action={<Button asChild variant="outline"><Link href="/employees-settings">{feedbackT("backTo", { subject: feedbackT("subjects.employees") })}</Link></Button>}
        />
      </SectionCard>
    </Container>
  );
};

export default EmployeeTrashPage;
