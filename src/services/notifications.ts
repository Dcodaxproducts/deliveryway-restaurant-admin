import api from "@/lib/axios";

export type GetNotificationsParams = {
  restaurantId: string;
  branchId?: string;
  status?: "pending" | "seen";
};

export const getNotifications = async (params: GetNotificationsParams) => {
  const { data } = await api.get("/notifications", { params });
  return data;
};

export const markAllNotificationsSeen = async () => {
  const { data } = await api.post("/notifications/seen-all");
  return data;
};
