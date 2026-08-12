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
  order?: {
    id: string;
    restaurantId?: string;
    branchId?: string;
    status?: string;
    paymentStatus?: string;
  } | null;
};

export type AdminNotificationsResponse = {
  data: AdminNotification[];
  meta?: unknown;
  message?: string;
};

export type AdminNotificationSummary = {
  total: number;
  unseen: number;
  seen: number;
};

export type AdminNotificationSummaryResponse = {
  data: AdminNotificationSummary;
  message?: string;
};
