export type AdminNotificationStatus = "PENDING" | "SEEN" | string;

export type AdminNotificationMetadata = {
  reservationId?: string;
  branchId?: string;
  customerId?: string;
  [key: string]: unknown;
};

export type AdminNotification = {
  id: string;
  type: string;
  title?: string | null;
  message?: string | null;
  description?: string | null;
  status?: AdminNotificationStatus;
  seen?: boolean;
  createdAt?: string | null;
  metadata?: AdminNotificationMetadata | null;
};

export type AdminNotificationsResponse = {
  data: AdminNotification[];
  meta?: unknown;
  message?: string;
};
