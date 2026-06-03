import { describe, expect, it } from "vitest";

import { modifierSchema, updateModifierSchema } from "@/validations/modifiers";

describe("modifier validation", () => {
  it("requires categoryId when creating a modifier", () => {
    const result = modifierSchema.safeParse({
      restaurantId: "restaurant-1",
      categoryId: "",
      name: "Garlic Sauce",
    });

    expect(result.success).toBe(false);
  });

  it("defaults priceDelta and sortOrder", () => {
    const result = modifierSchema.safeParse({
      restaurantId: "restaurant-1",
      categoryId: "modifier-category-1",
      name: "Garlic Sauce",
    });

    expect(result.success).toBe(true);
    expect(result.data?.priceDelta).toBe(0);
    expect(result.data?.sortOrder).toBe(0);
  });

  it("rejects modifier without categoryId", () => {
    const result = modifierSchema.safeParse({
      restaurantId: "restaurant-1",
      name: "Garlic Sauce",
    });

    expect(result.success).toBe(false);
  });

  it("supports categoryId in update payloads", () => {
    const result = updateModifierSchema.safeParse({
      categoryId: "modifier-category-1",
      priceDelta: "0.75",
      sortOrder: "2",
    });

    expect(result.success).toBe(true);
    expect(result.data?.categoryId).toBe("modifier-category-1");
    expect(result.data?.priceDelta).toBe(0.75);
    expect(result.data?.sortOrder).toBe(2);
  });
});
