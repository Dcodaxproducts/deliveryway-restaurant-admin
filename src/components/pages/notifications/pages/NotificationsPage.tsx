"use client";

import { useTranslations } from "next-intl";
import Container from "@/components/common/Container";
import NotificationsHeader from "@/components/pages/Notifications/components/notifications/header";
import Notifications from "@/components/pages/Notifications/components/notifications/Notification";
import { useAuth } from "@/hooks/useAuth";
import { useGetNotifications } from "@/hooks/useNotifications";
import type { AdminNotification } from "@/types/notifications";
import { SectionCard } from "@/components/common/SectionCard";
import { StatePanel } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";

const NotificationsPage = () => {
  const feedbackT = useTranslations("common.feedback");
  const { restaurantId, branchId, isBranchAdmin, loading: authLoading } = useAuth();
  const scope = restaurantId
    ? {
        restaurantId,
        channel: "IN_APP" as const,
        ...(isBranchAdmin && branchId ? { branchId } : {}),
      }
    : undefined;

  const {
    data: notificationsResponse,
    isLoading: loading,
    refetch,
    isFetching,
    isError,
  } = useGetNotifications(scope);

  const notifications = notificationsResponse?.data || [];
  const hasUnread = notifications.some(
    (notification: AdminNotification) => !notification.seen,
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
        scope={scope as NonNullable<typeof scope>}
        refetch={() => refetch()}
      />

      <SectionCard padding="md">
        {authLoading ? (
          <StatePanel state="loading" title={feedbackT("loading", { subject: feedbackT("subjects.notifications") })} description={feedbackT("restaurantContextLoading")} compact />
        ) : !scope ? (
          <StatePanel state="unavailable" title={feedbackT("unavailable", { subject: feedbackT("subjects.notifications") })} description={feedbackT("restaurantContextRequired")} compact />
        ) : (
          <>
            {isError ? (
              <StatePanel
                state="error"
                title={feedbackT("loadFailed", { subject: feedbackT("subjects.notifications") })}
                description={feedbackT(notificationsResponse ? "cachedDescription" : "loadFailedDescription")}
                action={<Button type="button" variant="outline" disabled={isFetching} onClick={() => void refetch()}>{feedbackT("retry", { subject: feedbackT("subjects.notifications") })}</Button>}
                compact
              />
            ) : null}
            {!isError || notifications.length > 0 ? (
              <Notifications notifications={notifications} loading={!notificationsResponse && (loading || isFetching)} />
            ) : null}
          </>
        )}
      </SectionCard>
    </Container>
  );
};

export default NotificationsPage;
