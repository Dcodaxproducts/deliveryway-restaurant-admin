import { beforeEach, describe, expect, it, vi } from "vitest";

const apiGetMock = vi.hoisted(() => vi.fn());
const apiPostMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/axios", () => ({
  api: {
    get: apiGetMock,
    post: apiPostMock,
  },
}));

import {
  claimPendingOrderNotifications,
  getNotificationSummary,
  getNotifications,
  markAllNotificationsSeen,
  markNotificationSeen,
  normalizeNotificationsResponse,
} from "./notifications";

beforeEach(() => {
  apiGetMock.mockReset();
  apiPostMock.mockReset();
});

describe("normalizeNotificationsResponse", () => {
  it("maps the backend isSeen field to the admin unread state", () => {
    const result = normalizeNotificationsResponse({
      data: [
        {
          id: "notification-1",
          type: "ORDER_PLACED",
          isSeen: true,
        },
      ],
    });

    expect(result.data[0]?.seen).toBe(true);
  });
});

describe("restaurant admin notification feed", () => {
  const inAppScope = {
    restaurantId: "restaurant-1",
    branchId: "branch-1",
    channel: "IN_APP" as const,
  };

  it("requests only in-app notifications so email deliveries are not duplicated", async () => {
    apiGetMock.mockResolvedValue({ data: { data: [] } });

    await getNotifications(inAppScope);
    await getNotificationSummary(inAppScope);

    expect(apiGetMock).toHaveBeenNthCalledWith(1, "/notifications", {
      params: inAppScope,
    });
    expect(apiGetMock).toHaveBeenNthCalledWith(2, "/notifications/summary", {
      params: inAppScope,
    });
  });

  it("marks only the visible in-app notification feed as seen", async () => {
    apiPostMock.mockResolvedValue({ data: { data: { count: 1 } } });

    await markAllNotificationsSeen(inAppScope);

    expect(apiPostMock).toHaveBeenCalledWith(
      "/notifications/seen-all",
      undefined,
      { params: inAppScope },
    );
  });

  it("claims offline pending orders for the first logged-in operator", async () => {
    apiPostMock.mockResolvedValue({
      data: {
        data: [
          {
            id: "notification-1",
            type: "ORDER_PLACED",
            order: { id: "order-1", status: "PLACED" },
          },
        ],
      },
    });

    const result = await claimPendingOrderNotifications(inAppScope);

    expect(apiPostMock).toHaveBeenCalledWith(
      "/notifications/claim-pending-orders",
      undefined,
      { params: inAppScope },
    );
    expect(result.data[0]?.order?.id).toBe("order-1");
  });

  it("marks one opened notification as seen", async () => {
    apiPostMock.mockResolvedValue({ data: { data: { id: "notification-1" } } });

    await markNotificationSeen("notification-1");

    expect(apiPostMock).toHaveBeenCalledWith(
      "/notifications/notification-1/seen",
    );
  });
});
