import { beforeEach, describe, expect, it, vi } from "vitest";

import { httpClient } from "@/lib/axios";
import {
  createModifier,
  getModifiers,
  updateModifier,
} from "@/services/modifiers";

vi.mock("@/lib/axios", () => ({
  httpClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockedGet = vi.mocked(httpClient.get);
const mockedPost = vi.mocked(httpClient.post);
const mockedPatch = vi.mocked(httpClient.patch);

describe("modifiers service", () => {
  beforeEach(() => {
    mockedGet.mockReset();
    mockedPost.mockReset();
    mockedPatch.mockReset();
  });

  it("passes categoryId to modifier list endpoint", async () => {
    mockedGet.mockResolvedValueOnce({
      data: {
        modifiers: [
          {
            id: "modifier-1",
            categoryId: "modifier-category-1",
            name: "Garlic Sauce",
            priceDelta: 0.5,
          },
        ],
      },
    });

    const response = await getModifiers({
      restaurantId: "restaurant-1",
      categoryId: "modifier-category-1",
      page: 1,
      limit: 20,
    });

    expect(mockedGet).toHaveBeenCalledWith("/menu/modifiers", {
      params: {
        restaurantId: "restaurant-1",
        categoryId: "modifier-category-1",
        page: 1,
        limit: 20,
      },
    });
    expect(mockedGet.mock.calls[0]?.[0]).not.toContain("/api/v1");
    expect(response.data[0]?.categoryId).toBe("modifier-category-1");
  });

  it("creates and updates modifiers with categoryId without api prefix duplication", async () => {
    mockedPost.mockResolvedValueOnce({ success: true });
    mockedPatch.mockResolvedValueOnce({ success: true });

    await createModifier({
      restaurantId: "restaurant-1",
      categoryId: "modifier-category-1",
      name: "Garlic Sauce",
      priceDelta: 0.5,
      sortOrder: 1,
    });
    await updateModifier("modifier-1", {
      categoryId: "modifier-category-2",
      name: "Extra Garlic Sauce",
      priceDelta: 0.75,
      sortOrder: 2,
      isActive: true,
    });

    expect(mockedPost).toHaveBeenCalledWith("/menu/modifiers", {
      restaurantId: "restaurant-1",
      categoryId: "modifier-category-1",
      name: "Garlic Sauce",
      priceDelta: 0.5,
      sortOrder: 1,
    });
    expect(mockedPatch).toHaveBeenCalledWith("/menu/modifiers/modifier-1", {
      categoryId: "modifier-category-2",
      name: "Extra Garlic Sauce",
      priceDelta: 0.75,
      sortOrder: 2,
      isActive: true,
    });
    expect(mockedPost.mock.calls[0]?.[0]).not.toContain("/api/v1");
    expect(mockedPatch.mock.calls[0]?.[0]).not.toContain("/api/v1");
  });
});
