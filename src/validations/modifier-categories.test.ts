import { describe, expect, it } from "vitest";

import { modifierCategorySchema } from "@/validations/modifier-categories";

describe("modifier category validation", () => {
  it("requires name", () => {
    const result = modifierCategorySchema.safeParse({
      restaurantId: "restaurant-1",
      name: "",
      slug: "sauces",
    });

    expect(result.success).toBe(false);
  });

  it("allows optional slug and description", () => {
    const result = modifierCategorySchema.safeParse({
      restaurantId: "restaurant-1",
      name: "Sauces",
      sortOrder: "",
    });

    expect(result.success).toBe(true);
    expect(result.data?.sortOrder).toBeUndefined();
  });

  it("rejects negative sort order", () => {
    const result = modifierCategorySchema.safeParse({
      restaurantId: "restaurant-1",
      name: "Sauces",
      sortOrder: -1,
    });

    expect(result.success).toBe(false);
  });
});
