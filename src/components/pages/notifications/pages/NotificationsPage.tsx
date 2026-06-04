"use client";

import { useState } from "react";
import Container from "@/components/common/Container";
import NotificationsHeader from "@/components/pages/Notifications/components/notifications/header";
import Notifications from "@/components/pages/Notifications/components/notifications/Notification";
import { useAuth } from "@/hooks/useAuth";
import { useGetNotifications } from "@/hooks/useNotifications";
import type { AdminNotification } from "@/types/notifications";

const NotificationsPage = () => {
  const { restaurantId, branchId, isBranchAdmin } = useAuth();
  const [selectedTab, setSelectedTab] = useState("all");

  const { data: notificationsResponse, isLoading: loading, refetch } = useGetNotifications(
    restaurantId
      ? {
          restaurantId,
          ...(isBranchAdmin && branchId ? { branchId } : {}),
          ...(selectedTab === "pending" ? { status: "pending" } : {}),
        }
      : undefined
  );

  const notifications = notificationsResponse?.data || [];
  const hasUnread = notifications.some(
    (notification: AdminNotification) => !notification.seen
  );

  return (
    <Container>
      <NotificationsHeader
        title="Notifications"
        description={
          isBranchAdmin
            ? "Manage alerts and customer activity for your assigned branch."
            : "Manage your restaurant alerts, updates, and customer activity."
        }
        hasUnread={hasUnread}
        notifications={notifications}
        refetch={() => refetch()}
      />

      <Notifications
        notifications={notifications}
        loading={loading}
        selectedTab={selectedTab}
        setSelectedTab={setSelectedTab}
      />
    </Container>
  );
};

export default NotificationsPage;
