"use client";

import { Suspense } from "react";
import ChatUI from "@/components/pages/Notifications/chat/components/chat/Chat";
import Container from "@/components/common/Container";
import Header from "@/components/common/PageHeader";
import { useTranslations } from "next-intl";

const NotificationSettingsPage = () => {
  const common = useTranslations("common");
  const t = useTranslations("chat");

  return (
    <Container className="flex min-h-full flex-1 flex-col">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between w-full">
        <Header
          title={t("liveConsultation")}
          description={t("description")}
          titleClassName="text-2xl font-semibold text-dark"
          descriptionClassName="text-sm text-gray-500"
        />
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-[32px] w-full bg-white p-[10px] rounded-[14px]">
        <Suspense fallback={<div>{common("loading")}</div>}>
          <ChatUI />
        </Suspense>
      </div>
    </Container>
  );
};

export default NotificationSettingsPage;
