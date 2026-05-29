import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getNotificationSettings,
  updateNotificationSettings,
  NotificationSettingsValues,
} from "@/services/notifications/notification-settings.api";

/**
 * ==============================
 * GET NOTIFICATION SETTINGS
 * ==============================
 */
export const useGetNotificationSettings = () => {
  return useQuery({
    queryKey: ["notification-settings"], // no restaurant dimension now
    queryFn: getNotificationSettings,
  });
};

/**
 * ==============================
 * ==============================
 */
export const useUpdateNotificationSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: NotificationSettingsValues) =>
      updateNotificationSettings(payload),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["notification-settings"],
      });

      toast.success("Notification settings updated successfully!");
    },

    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message ||
          "Failed to update notification settings"
      );
    },
  });
};

import { getNotifications, markAllNotificationsSeen, type GetNotificationsParams } from "@/services/notifications";

export const notificationQueryKeys = {
  list: (params?: GetNotificationsParams) => [
    "notifications",
    params?.restaurantId,
    params?.branchId,
    params?.status,
  ] as const,
};

export const useGetNotifications = (params?: GetNotificationsParams) => {
  return useQuery({
    queryKey: notificationQueryKeys.list(params),
    queryFn: () => getNotifications(params as GetNotificationsParams),
    enabled: Boolean(params?.restaurantId),
  });
};

export const useMarkAllNotificationsSeen = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markAllNotificationsSeen,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
};
