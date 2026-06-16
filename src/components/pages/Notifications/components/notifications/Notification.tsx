"use client";

import {
  CheckCircle,
  UserPlus,
  DollarSign,
  Bell,
} from "lucide-react";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import {
  formatAdminNotification,
  type NotificationCategory,
} from "@/components/pages/Notifications/utils/notification-formatters";
import type { AdminNotification } from "@/types/notifications";

interface Props {
  notifications: AdminNotification[];
  loading: boolean;
}

/**
 * Order detail route.
 */
const getOrderDetailHref = (orderId: string) => `/orders/details/${orderId}`;

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

const getNestedString = (
  source: unknown,
  keys: string[]
): string | undefined => {
  if (!isRecord(source)) return undefined;

  let current: unknown = source;

  for (const key of keys) {
    if (!isRecord(current)) return undefined;
    current = current[key];
  }

  return typeof current === "string" && current.trim()
    ? current.trim()
    : undefined;
};

const extractOrderIdFromText = (text: string): string | undefined => {
  /**
   * Supports:
   * "New order cmqf5tqmc000qbzilaowxecbf"
   * "Payment paid for order cmqes2urg0060wxilct2qd237"
   */
  const match = text.match(/\border\s+([a-zA-Z0-9_-]{10,})\b/i);
  return match?.[1];
};

const extractOrderId = (
  rawNotification: AdminNotification,
  formattedNotification: ReturnType<typeof formatAdminNotification>
): string | undefined => {
  const directOrderId =
    getNestedString(rawNotification, ["orderId"]) ||
    getNestedString(rawNotification, ["order_id"]) ||
    getNestedString(rawNotification, ["entityId"]) ||
    getNestedString(rawNotification, ["referenceId"]) ||
    getNestedString(rawNotification, ["metadata", "orderId"]) ||
    getNestedString(rawNotification, ["metadata", "order_id"]) ||
    getNestedString(rawNotification, ["data", "orderId"]) ||
    getNestedString(rawNotification, ["data", "order_id"]) ||
    getNestedString(rawNotification, ["payload", "orderId"]) ||
    getNestedString(rawNotification, ["payload", "order_id"]) ||
    getNestedString(rawNotification, ["order", "id"]);

  if (directOrderId) return directOrderId;

  const searchableText = [
    formattedNotification.title,
    formattedNotification.description,
  ]
    .filter(Boolean)
    .join(" ");

  return extractOrderIdFromText(searchableText);
};

export default function Notifications({
  notifications,
  loading,
}: Props) {
  const getIcon = (category: NotificationCategory) => {
    switch (category) {
      case "reservation":
        return <UserPlus size={18} />;
      case "payout":
        return <DollarSign size={18} />;
      case "order":
        return <CheckCircle size={18} />;
      default:
        return <Bell size={18} />;
    }
  };

  const formattedNotifications = notifications.map((rawNotification) => {
    const formattedNotification = formatAdminNotification(rawNotification);

    const orderId = extractOrderId(rawNotification, formattedNotification);

    return {
      ...formattedNotification,
      href:
        formattedNotification.href ||
        (orderId ? getOrderDetailHref(orderId) : undefined),
    };
  });

  return (
    <div className="space-y-4">
      {loading && (
        <p className="text-sm text-gray-400">Loading notifications...</p>
      )}

      {!loading && notifications.length === 0 && (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <Bell className="mb-3 text-gray-300" size={40} />
          <p className="text-sm text-gray-500">No notifications found</p>
        </div>
      )}

      {!loading &&
        formattedNotifications.map((notification) => {
          const content = (
            <CardContent className="flex items-start justify-between gap-4 p-4">
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-white">
                  {getIcon(notification.category)}
                </div>

                <div className="min-w-0">
                  <CardTitle className="mb-1 break-words text-base font-semibold text-gray-900">
                    {notification.title}
                  </CardTitle>

                  <p className="break-words text-sm text-gray-500">
                    {notification.description}
                  </p>
                </div>
              </div>

              <span className="shrink-0 whitespace-nowrap text-xs text-gray-400">
                {notification.createdAt
                  ? new Date(notification.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : ""}
              </span>
            </CardContent>
          );

          return (
            <Card
              key={notification.id}
              className={`bg-white shadow-sm transition-all hover:shadow-lg ${
                notification.href ? "cursor-pointer" : ""
              }`}
            >
              {notification.href ? (
                <Link href={notification.href} className="block">
                  {content}
                </Link>
              ) : (
                content
              )}
            </Card>
          );
        })}
    </div>
  );
}