"use client";

import { Button } from "@/components/ui/button";
import Header from "@/components/common/PageHeader";
import { useMarkAllNotificationsSeen } from "@/hooks/useNotifications";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface Props {
  title: string;
  description: string;
  hasUnread: boolean;
  notifications: any[];
  refetch: () => void;
}

export default function NotificationsHeader({
  title,
  description,
  hasUnread,
  notifications,
  refetch,
}: Props) {
  const common = useTranslations("common");
  const t = useTranslations("notifications");
  const markAllSeenMutation = useMarkAllNotificationsSeen();
  const loading = markAllSeenMutation.isPending;

  const handleMarkAllRead = async () => {
    const hasPending = notifications.some((n) => n.status === "PENDING");

    if (!hasPending) return;

    try {
      await markAllSeenMutation.mutateAsync();

      toast.success(t("allMarkedRead"));
      refetch();
    } catch {
      toast.error(t("updateFailed"));
    }
  };

  return (
    <div className="flex flex-col gap-4 md:gap-6 lg:flex-row lg:items-center lg:justify-between w-full">
      <Header title={title} description={description} />

      <Button
        variant="default"
        disabled={!hasUnread || loading}
        onClick={handleMarkAllRead}
        className="h-[44px] rounded-[12px] px-5 flex items-center gap-2 bg-primary hover:bg-red-800 text-white text-[15px] font-[500] disabled:opacity-50"
      >
        {loading ? common("updating") : t("markAllRead")}
      </Button>
    </div>
  );
}
