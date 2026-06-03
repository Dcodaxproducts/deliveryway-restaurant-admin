import { beforeEach, describe, expect, it, vi } from "vitest";

import api from "@/lib/axios";
import { getMenuItems } from "@/services/menus";

vi.mock("@/lib/axios", () => ({
  default: {
    get: vi.fn(),
  },
}));

const mockedGet = vi.mocked(api.get);

describe("menu items service", () => {
  beforeEach(() => {
    mockedGet.mockReset();
  });

  it("sends categoryId with menu item list params", async () => {
    mockedGet.mockResolvedValueOnce({ data: { data: [] } });

    await getMenuItems({
      page: 1,
      limit: 10,
      search: "pizza",
      restaurantId: "restaurant-1",
      categoryId: "category-1",
    });

    expect(mockedGet).toHaveBeenCalledWith("/menu/items", {
      params: {
        page: 1,
        limit: 10,
        search: "pizza",
        restaurantId: "restaurant-1",
        categoryId: "category-1",
      },
    });
  });

  it("omits empty categoryId and does not duplicate api prefix", async () => {
    mockedGet.mockResolvedValueOnce({ data: { data: [] } });

    await getMenuItems({
      restaurantId: "restaurant-1",
      categoryId: "",
    });

    expect(mockedGet).toHaveBeenCalledWith("/menu/items", {
      params: {
        restaurantId: "restaurant-1",
      },
    });
    expect(mockedGet.mock.calls[0]?.[0]).not.toContain("/api/v1");
  });
});
