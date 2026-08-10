import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getNotificationSettings,
  updateNotificationSettings,
  NotificationSettingsValues,
} from "@/services/notifications/notification-settings.api";
import { useAuth } from "@/hooks/useAuth";
import { getApiErrorMessage } from "@/lib/errors";

/**
 * ==============================
 * GET NOTIFICATION SETTINGS
 * ==============================
 */
export const useGetNotificationSettings = () => {
  const { restaurantId } = useAuth();

  return useQuery({
    queryKey: ["notification-settings", restaurantId],
    queryFn: () => getNotificationSettings(restaurantId as string),
    enabled: Boolean(restaurantId),
  });
};

/**
 * ==============================
 * ==============================
 */
export const useUpdateNotificationSettings = () => {
  const queryClient = useQueryClient();
  const { restaurantId } = useAuth();

  return useMutation({
    mutationFn: (payload: NotificationSettingsValues) => {
      if (!restaurantId) {
        throw new Error("Restaurant context is required");
      }

      return updateNotificationSettings(restaurantId, payload);
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["notification-settings", restaurantId],
      });

      toast.success("Notification settings updated successfully!");
    },

    onError: (error: unknown) => {
      toast.error(
        getApiErrorMessage(error, "Failed to update notification settings"),
      );
    },
  });
};

import {
  getNotifications,
  getNotificationSummary,
  markAllNotificationsSeen,
  type GetNotificationsParams,
} from "@/services/notifications";

export const notificationQueryKeys = {
  list: (params?: GetNotificationsParams) =>
    [
      "notifications",
      params?.restaurantId,
      params?.branchId,
      params?.status,
      params?.channel,
    ] as const,
  summary: (params?: GetNotificationsParams) =>
    [
      "notifications",
      "summary",
      params?.restaurantId,
      params?.branchId,
      params?.channel,
    ] as const,
};

export const useGetNotifications = (params?: GetNotificationsParams) => {
  return useQuery({
    queryKey: notificationQueryKeys.list(params),
    queryFn: () => getNotifications(params as GetNotificationsParams),
    enabled: Boolean(params?.restaurantId),
  });
};

export const useGetNotificationSummary = (params?: GetNotificationsParams) => {
  return useQuery({
    queryKey: notificationQueryKeys.summary(params),
    queryFn: () => getNotificationSummary(params as GetNotificationsParams),
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
