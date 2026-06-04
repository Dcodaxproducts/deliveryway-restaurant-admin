import type {
  AdminNotification,
  AdminNotificationMetadata,
} from "@/types/notifications";

export type NotificationCategory = "reservation" | "payout" | "order" | "default";

export type FormattedNotification = {
  id: string;
  type: string;
  title: string;
  description: string;
  category: NotificationCategory;
  status?: string;
  seen?: boolean;
  createdAt?: string | null;
  href?: string;
};

const getString = (value: unknown) => {
  return typeof value === "string" ? value : "";
};

const getMetadata = (notification: AdminNotification): AdminNotificationMetadata => {
  return notification.metadata && typeof notification.metadata === "object"
    ? notification.metadata
    : {};
};

const getReservationHref = (metadata: AdminNotificationMetadata) => {
  const reservationId = getString(metadata.reservationId);

  return reservationId
    ? `/table-reservations?search=${encodeURIComponent(reservationId)}`
    : undefined;
};

const getNotificationType = (notification: AdminNotification) => {
  return getString(notification.type).toUpperCase();
};

const getFallbackTitle = (notification: AdminNotification) => {
  return getString(notification.title) || "Notification";
};

const getFallbackDescription = (notification: AdminNotification) => {
  return (
    getString(notification.description) ||
    getString(notification.message) ||
    "No description"
  );
};

export function formatAdminNotification(
  notification: AdminNotification
): FormattedNotification {
  const type = getNotificationType(notification);
  const metadata = getMetadata(notification);

  if (type.includes("RESERVATION") && type.includes("REQUEST")) {
    return {
      id: notification.id,
      type: notification.type,
      title: getString(notification.title) || "New reservation request",
      description: getFallbackDescription(notification),
      category: "reservation",
      status: notification.status,
      seen: notification.seen,
      createdAt: notification.createdAt,
      href: getReservationHref(metadata),
    };
  }

  if (
    type.includes("RESERVATION") &&
    (type.includes("ACCEPT") || type.includes("CONFIRM"))
  ) {
    return {
      id: notification.id,
      type: notification.type,
      title: getString(notification.title) || "Reservation confirmed",
      description: getFallbackDescription(notification),
      category: "reservation",
      status: notification.status,
      seen: notification.seen,
      createdAt: notification.createdAt,
      href: getReservationHref(metadata),
    };
  }

  const category = type.includes("PAYOUT")
    ? "payout"
    : type.includes("ORDER")
      ? "order"
      : "default";

  return {
    id: notification.id,
    type: notification.type,
    title: getFallbackTitle(notification),
    description: getFallbackDescription(notification),
    category,
    status: notification.status,
    seen: notification.seen,
    createdAt: notification.createdAt,
  };
}
