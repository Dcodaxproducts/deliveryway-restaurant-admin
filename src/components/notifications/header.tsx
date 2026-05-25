"use client";

import { Button } from "@/components/ui/button";
import Header from "../header";
import { useHttpClient } from "@/hooks/useHttpClient";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

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
  const { token } = useAuth();
  const { post, loading } = useHttpClient(token);

  const handleMarkAllRead = async () => {
    const hasPending = notifications.some((n) => n.status === "PENDING");

    if (!hasPending) return;

    try {
      await post("/v1/notifications/seen-all");

      toast.success("All notifications marked as read");
      refetch();
    } catch {
      toast.error("Failed to update notifications");
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
        {loading ? "Updating..." : "Mark all as read"}
      </Button>
    </div>
  );
}