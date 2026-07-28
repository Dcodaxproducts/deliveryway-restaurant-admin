import { beforeEach, describe, expect, it, vi } from "vitest";

import { api } from "@/lib/axios";
import {
  getNotificationSettings,
  updateNotificationSettings,
} from "./notificationSettings";

vi.mock("@/lib/axios", () => ({
  api: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}));

describe("restaurant notification settings service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads notification settings for the selected restaurant", async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: {
        data: {
          emailAddress: "ops@example.com",
          phoneNumber: null,
          whatsappNumber: null,
          notificationTypes: {
            newOrder: { email: true, sms: false, whatsapp: false },
          },
        },
      },
    });

    await expect(getNotificationSettings("restaurant-1")).resolves.toEqual({
      emailAddress: "ops@example.com",
      phoneNumber: "",
      whatsappNumber: "",
      notificationTypes: {
        newOrder: { email: true, sms: false, whatsapp: false },
      },
    });
    expect(api.get).toHaveBeenCalledWith(
      "/restaurants/restaurant-1/notification-settings",
    );
  });

  it("updates the selected restaurant instead of global settings", async () => {
    vi.mocked(api.patch).mockResolvedValue({ data: { success: true } });
    const payload = {
      emailAddress: "ops@example.com",
      phoneNumber: "",
      whatsappNumber: "",
      notificationTypes: {
        newOrder: { email: true, sms: false, whatsapp: false },
      },
    };

    await updateNotificationSettings("restaurant-1", payload);

    expect(api.patch).toHaveBeenCalledWith(
      "/restaurants/restaurant-1/notification-settings",
      payload,
    );
  });
});
