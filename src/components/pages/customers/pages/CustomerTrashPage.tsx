"use client";

import Link from "next/link";
import Container from "@/components/common/Container";
import { StatePanel } from "@/components/common/EmptyState";
import Header from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { SectionCard } from "@/components/common/SectionCard";

const CustomerTrashPage = () => {
  const t = useTranslations("customers");
  const feedbackT = useTranslations("common.feedback");

  return (
    <Container>
      <Header title={t("trashTitle")} />
      <SectionCard padding="md">
        <StatePanel
          state="unavailable"
          title={feedbackT("unavailable", { subject: t("trashTitle") })}
          description={feedbackT("trashUnavailableDescription")}
          action={<Button asChild variant="outline"><Link href="/customer-settings">{feedbackT("backTo", { subject: feedbackT("subjects.customers") })}</Link></Button>}
        />
      </SectionCard>
    </Container>
  );
};

export default CustomerTrashPage;
