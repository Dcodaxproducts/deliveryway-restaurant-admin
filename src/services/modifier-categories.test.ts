import { beforeEach, describe, expect, it, vi } from "vitest";

import { httpClient } from "@/lib/axios";
import {
  createModifierCategory,
  deleteModifierCategory,
  getModifierCategories,
  updateModifierCategory,
} from "@/services/modifier-categories";

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

describe("modifier categories service", () => {
  beforeEach(() => {
    mockedGet.mockReset();
    mockedPost.mockReset();
    mockedPatch.mockReset();
    mockedDelete.mockReset();
  });

  it("calls category list endpoint with params and normalized meta", async () => {
    mockedGet.mockResolvedValueOnce({
      success: true,
      data: {
        modifierCategories: [
          {
            id: "modifier-category-1",
            restaurantId: "restaurant-1",
            name: "Sauces",
            slug: "sauces",
          },
        ],
        meta: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
        },
      },
    });

    const response = await getModifierCategories({
      restaurantId: "restaurant-1",
      page: 1,
      limit: 20,
      search: "sauce",
    });

    expect(mockedGet).toHaveBeenCalledWith("/menu/modifier-categories", {
      params: {
        restaurantId: "restaurant-1",
        page: 1,
        limit: 20,
        search: "sauce",
      },
    });
    expect(mockedGet.mock.calls[0]?.[0]).not.toContain("/api/v1");
    expect(response.data[0]?.name).toBe("Sauces");
    expect(response.meta.total).toBe(1);
  });

  it("creates, updates, and deletes categories without api prefix duplication", async () => {
    mockedPost.mockResolvedValueOnce({ success: true });
    mockedPatch.mockResolvedValueOnce({ success: true });
    mockedDelete.mockResolvedValueOnce({ success: true });

    await createModifierCategory({
      restaurantId: "restaurant-1",
      name: "Sauces",
      slug: "sauces",
      description: "Sauce options",
      sortOrder: 1,
    });
    await updateModifierCategory("modifier-category-1", {
      name: "Premium Sauces",
      slug: "premium-sauces",
      isActive: true,
    });
    await deleteModifierCategory("modifier-category-1");

    expect(mockedPost).toHaveBeenCalledWith("/menu/modifier-categories", {
      restaurantId: "restaurant-1",
      name: "Sauces",
      slug: "sauces",
      description: "Sauce options",
      sortOrder: 1,
    });
    expect(mockedPatch).toHaveBeenCalledWith(
      "/menu/modifier-categories/modifier-category-1",
      {
        name: "Premium Sauces",
        slug: "premium-sauces",
        isActive: true,
      }
    );
    expect(mockedDelete).toHaveBeenCalledWith(
      "/menu/modifier-categories/modifier-category-1"
    );
    expect(mockedPost.mock.calls[0]?.[0]).not.toContain("/api/v1");
    expect(mockedPatch.mock.calls[0]?.[0]).not.toContain("/api/v1");
    expect(mockedDelete.mock.calls[0]?.[0]).not.toContain("/api/v1");
  });

  it("create service sends body without isActive", async () => {
    mockedPost.mockResolvedValueOnce({ success: true });

    await createModifierCategory({
      restaurantId: "restaurant-1",
      name: "Sauces",
      slug: "sauces",
      description: "Sauce options",
      sortOrder: 1,
    });

    expect(mockedPost).toHaveBeenCalledWith("/menu/modifier-categories", {
      restaurantId: "restaurant-1",
      name: "Sauces",
      slug: "sauces",
      description: "Sauce options",
      sortOrder: 1,
    });
    expect(mockedPost.mock.calls[0]?.[1]).not.toHaveProperty("isActive");
    expect(mockedPost.mock.calls[0]?.[0]).not.toContain("/api/v1");
  });

  it("update service sends isActive when updating", async () => {
    mockedPatch.mockResolvedValueOnce({ success: true });

    await updateModifierCategory("modifier-category-1", {
      isActive: false,
    });

    expect(mockedPatch).toHaveBeenCalledWith(
      "/menu/modifier-categories/modifier-category-1",
      {
        isActive: false,
      }
    );
  });
});
