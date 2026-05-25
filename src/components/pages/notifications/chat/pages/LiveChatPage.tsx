import { Suspense } from "react";
import ChatUI from "@/components/chat/Chat";
import Container from "@/components/container";
import Header from "@/components/header";

const NotificationSettingsPage = () => {
  return (
    <Container>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between w-full">
        <Header
          title="Live Consultation"
          description="View and manage your Chat"
          titleClassName="text-2xl font-semibold text-dark"
          descriptionClassName="text-sm text-gray-500"
        />
      </div>

      <div className="flex flex-col gap-[32px] w-full bg-white p-[10px] rounded-[14px]">
        <Suspense fallback={<div>Loading chat...</div>}>
          <ChatUI />
        </Suspense>
      </div>
    </Container>
  );
};

export default NotificationSettingsPage;