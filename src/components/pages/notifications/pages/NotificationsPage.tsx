"use client";

import { useEffect, useState } from "react";
import Container from "@/components/container";
import NotificationsHeader from "@/components/notifications/header";
import Notifications from "@/components/notifications/Notification";
import { useHttpClient } from "@/hooks/useHttpClient";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const NotificationsPage = () => {
  const { token, restaurantId, branchId, isBranchAdmin } = useAuth();
  const { get, loading } = useHttpClient(token);

  const [notifications, setNotifications] = useState<any[]>([]);
  const [selectedTab, setSelectedTab] = useState("all");

  const fetchNotifications = async () => {
    if (!restaurantId) return;

    try {
      let url = `/v1/notifications?restaurantId=${restaurantId}${isBranchAdmin && branchId ? `&branchId=${branchId}` : ""}`;

      if (selectedTab === "pending") {
        url += `&status=PENDING`;
      }

      const res = await get(url);
      if (!res) return;

      setNotifications(res?.data || []);
    } catch (err) {
      toast.error("Failed to fetch notifications");
    }
  };

  useEffect(() => {
    if (!token) return;
    fetchNotifications();
  }, [token, selectedTab, restaurantId, branchId, isBranchAdmin]);

  /*  Check unread */
  const hasUnread = notifications.some(
    (n) => n.status === "PENDING"
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
        refetch={fetchNotifications}
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