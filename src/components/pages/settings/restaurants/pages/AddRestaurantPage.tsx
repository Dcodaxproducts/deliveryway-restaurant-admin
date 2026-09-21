"use client";

import Container from "@/components/common/Container";
import { StatePanel } from "@/components/common/EmptyState";
import PageHeader from "@/components/common/PageHeader";
import { useTranslations } from "next-intl";

const AddRestaurant = () => {
  const feedback = useTranslations("common.feedback");
  const t = useTranslations("restaurants");

  return (
    <Container>
      <PageHeader title={t("addTitle")} description={t("addDescription")} />
      <StatePanel
        state="unavailable"
        title={feedback("unavailable", { subject: t("title") })}
        description={feedback("restaurantUnavailableDescription")}
      />
    </Container>
  );
};

export default AddRestaurant;
