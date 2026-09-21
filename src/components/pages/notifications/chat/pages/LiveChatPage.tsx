"use client";

import { Suspense } from "react";
import ChatUI from "@/components/pages/Notifications/chat/components/chat/Chat";
import Container from "@/components/common/Container";
import { StatePanel } from "@/components/common/EmptyState";
import PageHeader from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { useTranslations } from "next-intl";

const NotificationSettingsPage = () => {
  const feedback = useTranslations("common.feedback");
  const t = useTranslations("chat");

  return (
    <Container className="flex min-h-full flex-1 flex-col">
      <PageHeader
        title={t("liveConsultation")}
        description={t("description")}
      />

      <SectionCard className="flex min-h-0 flex-1 flex-col" padding="sm">
        <Suspense
          fallback={
            <StatePanel
              state="loading"
              compact
              title={t("loading")}
              description={feedback("loadingDescription")}
            />
          }
        >
          <ChatUI />
        </Suspense>
      </SectionCard>
    </Container>
  );
};

export default NotificationSettingsPage;
