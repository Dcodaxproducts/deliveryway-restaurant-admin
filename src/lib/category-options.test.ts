import { describe, expect, it } from "vitest";

import {
  getCategoryInitials,
  mergeUniqueCategoryOptions,
  normalizeCategoryOption,
} from "@/lib/category-options";

describe("category option utilities", () => {
  it("builds image fallback initials", () => {
    expect(getCategoryInitials("Main Course")).toBe("MC");
    expect(getCategoryInitials("")).toBe("C");
  });

  it("normalizes missing imageUrl to null", () => {
    expect(
      normalizeCategoryOption({
        id: "category-1",
        name: "Pizza",
      })
    ).toEqual({
      id: "category-1",
      name: "Pizza",
      imageUrl: null,
      slug: null,
      itemCount: undefined,
    });
  });

  it("merges paginated categories without duplicates", () => {
    expect(
      mergeUniqueCategoryOptions(
        [
          {
            id: "category-1",
            name: "Pizza",
          },
        ],
        [
          {
            id: "category-1",
            name: "Pizza updated",
          },
          {
            id: "category-2",
            name: "Drinks",
          },
        ]
      )
    ).toEqual([
      {
        id: "category-1",
        name: "Pizza updated",
      },
      {
        id: "category-2",
        name: "Drinks",
      },
    ]);
  });
});
