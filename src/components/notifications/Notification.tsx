"use client";

import {
  CheckCircle,
  UserPlus,
  DollarSign,
  Bell,
} from "lucide-react";
import { Card, CardContent, CardTitle } from "@/components/ui/card";

interface Props {
  notifications: any[];
  loading: boolean;
  selectedTab: string;
  setSelectedTab: (tab: string) => void;
}

export default function Notifications({
  notifications,
  loading,
  selectedTab,
  setSelectedTab,
}: Props) {
  const getIcon = (type: string) => {
    switch (type) {
      case "reservation":
        return <UserPlus />;
      case "payout":
        return <DollarSign />;
      case "order":
        return <CheckCircle />;
      default:
        return <Bell />;
    }
  };

  const filteredNotifications =
    selectedTab === "all"
      ? notifications
      : notifications.filter(
          (n) => n.status === "PENDING"
        );

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="mb-4">
        <div className="flex space-x-4 border-b border-gray-200">
          <button
            className={`px-4 py-2 text-sm font-semibold ${
              selectedTab === "all"
                ? "text-primary"
                : "text-gray-600"
            }`}
            onClick={() => setSelectedTab("all")}
          >
            All
          </button>

          <button
            className={`px-4 py-2 text-sm font-semibold ${
              selectedTab === "pending"
                ? "text-primary"
                : "text-gray-600"
            }`}
            onClick={() => setSelectedTab("pending")}
          >
            Pending
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <p className="text-sm text-gray-400">
          Loading notifications...
        </p>
      )}

      {/* Empty */}
      {!loading && filteredNotifications.length === 0 && (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <Bell className="text-gray-300 mb-3" size={40} />
          <p className="text-gray-500 text-sm">
            No notifications found
          </p>
        </div>
      )}

      {/* List */}
      {!loading &&
        filteredNotifications.map((notification) => (
          <Card
            key={notification.id}
            className="bg-white shadow-sm hover:shadow-lg transition-all"
          >
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary text-white rounded-full">
                  {getIcon(notification.type)}
                </div>

                <div>
                  <CardTitle className="font-semibold text-gray-900 mb-1">
                    {notification.title || "Notification"}
                  </CardTitle>

                  <p className="text-sm text-gray-500">
                    {notification.description ||
                      "No description"}
                  </p>
                </div>
              </div>

              <span className="text-xs text-gray-400">
                {notification.createdAt
                  ? new Date(
                      notification.createdAt
                    ).toLocaleTimeString()
                  : ""}
              </span>
            </CardContent>
          </Card>
        ))}
    </div>
  );
}