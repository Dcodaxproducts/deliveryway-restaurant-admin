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
 * UPDATE NOTIFICATION SETTINGS
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