import { beforeEach, describe, expect, it, vi } from "vitest";

import { httpClient } from "@/lib/axios";
import {
  getRestaurantOrderingSettings,
  normalizeRestaurantOrderingSettings,
  updateRestaurantOrderingSettings,
} from "@/services/ordering-settings";

vi.mock("@/lib/axios", () => ({
  httpClient: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}));

const mockedHttpClient = vi.mocked(httpClient);

describe("ordering settings service", () => {
  beforeEach(() => {
    mockedHttpClient.get.mockReset();
    mockedHttpClient.patch.mockReset();
  });

  it("defaults missing ordering flags to enabled", () => {
    expect(normalizeRestaurantOrderingSettings({})).toEqual({
      preorderEnabled: true,
      tipsEnabled: true,
    });
    expect(
      normalizeRestaurantOrderingSettings({
        data: { preorderEnabled: false },
      }),
    ).toEqual({
      preorderEnabled: false,
      tipsEnabled: true,
    });
  });

  it("preserves explicit false values from a direct response", () => {
    expect(
      normalizeRestaurantOrderingSettings({
        preorderEnabled: false,
        tipsEnabled: false,
      }),
    ).toEqual({
      preorderEnabled: false,
      tipsEnabled: false,
    });
  });

  it("gets ordering settings from the dedicated restaurant endpoint", async () => {
    mockedHttpClient.get.mockResolvedValueOnce({
      data: { preorderEnabled: false, tipsEnabled: true },
    });

    await expect(
      getRestaurantOrderingSettings("restaurant-1"),
    ).resolves.toEqual({
      preorderEnabled: false,
      tipsEnabled: true,
    });
    expect(mockedHttpClient.get).toHaveBeenCalledWith(
      "/restaurants/restaurant-1/ordering-settings",
    );
  });

  it("patches only the dedicated ordering settings payload", async () => {
    const settings = { preorderEnabled: true, tipsEnabled: false };
    mockedHttpClient.patch.mockResolvedValueOnce({ data: settings });

    await expect(
      updateRestaurantOrderingSettings("restaurant-1", settings),
    ).resolves.toEqual(settings);
    expect(mockedHttpClient.patch).toHaveBeenCalledWith(
      "/restaurants/restaurant-1/ordering-settings",
      settings,
    );
  });
});
