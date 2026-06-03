import { describe, expect, it } from "vitest";

import { getNextCategoriesPageParam } from "@/hooks/useMenuCategories";
import { normalizeMenuCategoriesResponse } from "@/services/categories";

describe("menu category service helpers", () => {
  it("normalizes category data and meta", () => {
    const result = normalizeMenuCategoriesResponse({
      data: {
        categories: [
          {
            id: "category-1",
            name: "Pizza",
            imageUrl: "https://cdn.example.com/pizza.png",
            slug: "pizza",
            itemCount: "12",
          },
          {
            id: "category-2",
            name: "Drinks",
          },
        ],
        meta: {
          page: 1,
          totalPages: 2,
          hasNext: true,
        },
      },
    });

    expect(result.data).toEqual([
      {
        id: "category-1",
        name: "Pizza",
        imageUrl: "https://cdn.example.com/pizza.png",
        slug: "pizza",
        itemCount: 12,
      },
      {
        id: "category-2",
        name: "Drinks",
        imageUrl: null,
        slug: null,
        itemCount: undefined,
      },
    ]);
    expect(result.meta).toEqual({
      page: 1,
      totalPages: 2,
      hasNext: true,
    });
  });

  it("computes infinite pagination from meta and safely falls back", () => {
    expect(
      getNextCategoriesPageParam(
        {
          data: [{ id: "category-1", name: "Pizza" }],
          meta: { page: 1, totalPages: 3 },
        },
        []
      )
    ).toBe(2);

    expect(
      getNextCategoriesPageParam(
        {
          data: [],
          meta: null,
        },
        [{ data: [], meta: null }]
      )
    ).toBeUndefined();
  });
});
