"use client";

import { VscBell } from "react-icons/vsc";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useGetNotificationSummary } from "@/hooks/useNotifications";
import { hasStaffPermission, isStaffRole } from "@/lib/auth";

export default function NotificationBell() {
  const { user, restaurantId, branchId, isBranchAdmin } = useAuth();
  const canViewNotifications =
    !isStaffRole(user?.role, user?.actorType) ||
    hasStaffPermission(user, ["notifications"]);
  const { data } = useGetNotificationSummary(
    canViewNotifications && restaurantId
      ? {
          restaurantId,
          channel: "IN_APP" as const,
          ...(isBranchAdmin && branchId ? { branchId } : {}),
        }
      : undefined,
  );
  const unseen = data?.data?.unseen ?? 0;

  if (!canViewNotifications) {
    return null;
  }

  const requestDesktopNotificationPermission = () => {
    if (
      typeof Notification !== "undefined" &&
      Notification.permission === "default"
    ) {
      void Notification.requestPermission();
    }
  };

  return (
    <Link
      href="/notifications"
      onClick={requestDesktopNotificationPermission}
      aria-label={
        unseen > 0 ? `Notifications, ${unseen} unread` : "Notifications"
      }
      className={cn(
        "relative flex items-center justify-center bg-primary/10 hover:bg-primary/20 transition-colors duration-200 rounded-xl shrink-0",
        "mx-2 w-[38px] h-[40px] p-0",
        "lg:mx-[39px] lg:w-[45.78px] lg:h-[48px]",
      )}
    >
      <VscBell
        className="w-[18px] h-[18px] lg:w-[22px] lg:h-[22px] text-primary"
        strokeWidth={0.4}
      />

      {unseen > 0 && (
        <span
          className={cn(
            "absolute flex items-center justify-center bg-[#2D9CDB] border-2 border-background text-white rounded-full font-semibold",
            "-top-1 -right-1 min-w-5 h-5 px-1 text-[10px]",
            "lg:-top-1.5 lg:-right-1.5 lg:min-w-6 lg:h-6 lg:text-xs",
          )}
        >
          {unseen > 99 ? "99+" : unseen}
        </span>
      )}
    </Link>
  );
}
