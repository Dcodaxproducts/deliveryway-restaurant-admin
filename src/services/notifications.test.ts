import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/axios", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

import { normalizeNotificationsResponse } from "./notifications";

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
