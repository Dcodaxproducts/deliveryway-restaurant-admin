import { beforeEach, describe, expect, it, vi } from "vitest";

import { httpClient } from "@/lib/axios";
import {
  createModifier,
  getModifiers,
  syncModifierGroupLinks,
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
const mockedDelete = vi.mocked(httpClient.delete);

describe("modifiers service", () => {
  beforeEach(() => {
    mockedGet.mockReset();
    mockedPost.mockReset();
    mockedPatch.mockReset();
    mockedDelete.mockReset();
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
            modifierGroups: [
              {
                id: "group-1",
                name: "Choose sauces",
                minSelect: 1,
                maxSelect: 2,
              },
            ],
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
    expect(response.data[0]?.modifierGroups).toEqual([
      expect.objectContaining({
        id: "group-1",
        minSelect: 1,
        maxSelect: 2,
      }),
    ]);
  });

  it("creates modifiers without isActive and updates modifiers with isActive", async () => {
    mockedPost.mockResolvedValueOnce({ success: true });
    mockedPatch.mockResolvedValueOnce({ success: true });

    await createModifier({
      restaurantId: "restaurant-1",
      categoryId: "modifier-category-1",
      name: "Garlic Sauce",
      priceDelta: 0.5,
      sortOrder: 1,
      isActive: true,
    } as Parameters<typeof createModifier>[0] & { isActive: boolean });
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

  it("syncs only changed modifier group links", async () => {
    mockedPost.mockResolvedValue({ success: true });
    mockedDelete.mockResolvedValue({ success: true });

    await syncModifierGroupLinks({
      modifierId: "modifier-1",
      previousGroupIds: ["group-1", "group-2"],
      nextGroupIds: ["group-2", "group-3"],
      sortOrder: 4,
    });

    expect(mockedPost).toHaveBeenCalledWith(
      "/menu/modifier-groups/group-3/modifiers/modifier-1",
      { sortOrder: 4 }
    );
    expect(mockedDelete).toHaveBeenCalledWith(
      "/menu/modifier-groups/group-1/modifiers/modifier-1"
    );
    expect(mockedPost).toHaveBeenCalledTimes(1);
    expect(mockedDelete).toHaveBeenCalledTimes(1);
  });
});
