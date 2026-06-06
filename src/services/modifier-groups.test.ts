import { beforeEach, describe, expect, it, vi } from "vitest";

import { httpClient } from "@/lib/axios";
import {
  attachModifierToGroup,
  createModifierGroup,
  detachModifierFromGroup,
  getModifierGroups,
} from "@/services/modifier-groups";

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
const mockedDelete = vi.mocked(httpClient.delete);

describe("modifier groups service", () => {
  beforeEach(() => {
    mockedGet.mockReset();
    mockedPost.mockReset();
    mockedDelete.mockReset();
  });

  it("creates a modifier group with the expected payload", async () => {
    mockedPost.mockResolvedValueOnce({ success: true });

    await createModifierGroup({
      restaurantId: "restaurant-1",
      name: "Choose Sauces",
      description: "Pick your sauces",
      minSelect: 0,
      maxSelect: 3,
      sortOrder: 1,
    });

    expect(mockedPost).toHaveBeenCalledWith("/menu/modifier-groups", {
      restaurantId: "restaurant-1",
      name: "Choose Sauces",
      description: "Pick your sauces",
      minSelect: 0,
      maxSelect: 3,
      sortOrder: 1,
    });
    expect(mockedPost.mock.calls[0]?.[0]).not.toContain("/api/v1");
  });

  it("attaches a modifier through the group modifier endpoint", async () => {
    mockedPost.mockResolvedValueOnce({ success: true });

    await attachModifierToGroup("group-1", "modifier-1", { sortOrder: 2 });

    expect(mockedPost).toHaveBeenCalledWith(
      "/menu/modifier-groups/group-1/modifiers/modifier-1",
      { sortOrder: 2 }
    );
    expect(mockedPost.mock.calls[0]?.[0]).not.toContain("/api/v1");
  });

  it("detaches a modifier through the group modifier endpoint", async () => {
    mockedDelete.mockResolvedValueOnce({
      data: {
        modifierGroupId: "group-1",
        modifierId: "modifier-1",
      },
      message: "Modifier detached from group successfully",
    });

    const response = await detachModifierFromGroup("group-1", "modifier-1");

    expect(mockedDelete).toHaveBeenCalledWith(
      "/menu/modifier-groups/group-1/modifiers/modifier-1"
    );
    expect(mockedDelete.mock.calls[0]?.[0]).not.toContain("/api/v1");
    expect(response).toEqual({
      modifierGroupId: "group-1",
      modifierId: "modifier-1",
    });
  });

  it("falls back to input ids when detach response data is missing", async () => {
    mockedDelete.mockResolvedValueOnce({
      message: "Modifier detached from group successfully",
    });

    const response = await detachModifierFromGroup("group-1", "modifier-1");

    expect(mockedDelete).toHaveBeenCalledWith(
      "/menu/modifier-groups/group-1/modifiers/modifier-1"
    );
    expect(mockedDelete.mock.calls[0]?.[0]).not.toContain("/api/v1");
    expect(response).toEqual({
      modifierGroupId: "group-1",
      modifierId: "modifier-1",
    });
  });

  it("normalizes modifier arrays from list responses", async () => {
    mockedGet.mockResolvedValueOnce({
      data: {
        modifierGroups: [
          {
            id: "group-1",
            restaurantId: "restaurant-1",
            name: "Choose Sauces",
            minSelect: 0,
            maxSelect: 3,
            modifiers: [
              {
                id: "modifier-1",
                name: "Garlic Sauce",
                priceDelta: "0.50",
                sortOrder: 1,
                category: {
                  id: "category-1",
                  name: "Sauces",
                  slug: "sauces",
                },
              },
            ],
          },
          {
            id: "group-2",
            name: "Choose Bread",
            minSelect: 1,
            maxSelect: 1,
            groupModifiers: [
              {
                modifierId: "modifier-2",
                sortOrder: 3,
                modifier: {
                  id: "modifier-2",
                  name: "Naan",
                  priceDelta: 1,
                  category: {
                    id: "category-2",
                    name: "Bread",
                  },
                },
              },
            ],
          },
        ],
      },
      meta: {
        page: 1,
        limit: 10,
        total: 2,
      },
    });

    const response = await getModifierGroups({
      restaurantId: "restaurant-1",
      page: 1,
      limit: 10,
    });

    expect(mockedGet).toHaveBeenCalledWith("/menu/modifier-groups", {
      params: {
        restaurantId: "restaurant-1",
        page: 1,
        limit: 10,
      },
    });
    expect(response.data).toHaveLength(2);
    expect(response.data[0]?.modifiers).toEqual([
      {
        id: "modifier-1",
        name: "Garlic Sauce",
        priceDelta: 0.5,
        sortOrder: 1,
        category: {
          id: "category-1",
          name: "Sauces",
          slug: "sauces",
        },
      },
    ]);
    expect(response.data[1]?.modifiers?.[0]).toMatchObject({
      id: "modifier-2",
      name: "Naan",
      priceDelta: 1,
      sortOrder: 3,
      category: {
        id: "category-2",
        name: "Bread",
      },
    });
  });
});
