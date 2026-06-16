import { beforeEach, describe, expect, it, vi } from "vitest";

import { httpClient } from "@/lib/axios";
import {
  getGiftCardsVisibilityFromSettings,
  mergeGiftCardsVisibilitySettings,
  updateRestaurantGiftCardsVisibility,
} from "@/services/restaurants";

vi.mock("@/lib/axios", () => ({
  default: {
    get: vi.fn(),
  },
  httpClient: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}));

const mockedHttpClient = vi.mocked(httpClient);

describe("restaurants service", () => {
  beforeEach(() => {
    mockedHttpClient.get.mockReset();
    mockedHttpClient.patch.mockReset();
  });

  it("reads recommended gift-card visibility setting first", () => {
    expect(
      getGiftCardsVisibilityFromSettings({
        giftCardsEnabled: false,
        customerApp: {
          giftCardsEnabled: false,
          giftCards: {
            isEnabled: true,
          },
        },
      })
    ).toBe(true);
  });

  it("falls back through backend-supported legacy gift-card setting paths", () => {
    expect(
      getGiftCardsVisibilityFromSettings({
        giftCards: {
          isEnabled: true,
        },
      })
    ).toBe(true);
    expect(
      getGiftCardsVisibilityFromSettings({
        customerApp: {
          giftCardsEnabled: true,
        },
      })
    ).toBe(true);
    expect(getGiftCardsVisibilityFromSettings({ giftCardsEnabled: true })).toBe(
      true
    );
  });

  it("merges gift-card visibility without dropping existing settings", () => {
    expect(
      mergeGiftCardsVisibilitySettings(
        {
          printing: {
            enabled: true,
          },
          customerApp: {
            privacyPolicy: "<p>Policy</p>",
            giftCards: {
              headline: "Cards",
            },
          },
        },
        true
      )
    ).toEqual({
      printing: {
        enabled: true,
      },
      customerApp: {
        privacyPolicy: "<p>Policy</p>",
        giftCards: {
          headline: "Cards",
          isEnabled: true,
        },
      },
    });
  });

  it("updates gift-card visibility by GET merging settings before PATCH", async () => {
    mockedHttpClient.get.mockResolvedValueOnce({
      data: {
        id: "restaurant-1",
        settings: {
          ordering: {
            enabled: true,
          },
          customerApp: {
            privacyPolicy: "Existing policy",
          },
        },
      },
    });
    mockedHttpClient.patch.mockResolvedValueOnce({
      data: {
        id: "restaurant-1",
        settings: {
          customerApp: {
            giftCards: {
              isEnabled: true,
            },
          },
        },
      },
    });

    await updateRestaurantGiftCardsVisibility("restaurant-1", true);

    expect(mockedHttpClient.get).toHaveBeenCalledWith("/restaurants/restaurant-1");
    expect(mockedHttpClient.patch).toHaveBeenCalledWith("/restaurants/restaurant-1", {
      settings: {
        ordering: {
          enabled: true,
        },
        customerApp: {
          privacyPolicy: "Existing policy",
          giftCards: {
            isEnabled: true,
          },
        },
      },
    });
  });
});
