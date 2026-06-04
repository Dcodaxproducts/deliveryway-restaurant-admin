import { describe, expect, it } from "vitest";

import {
  buildModifierCategoryCreatePayload,
  buildModifierCategoryUpdatePayload,
  modifierCategorySchema,
} from "@/validations/modifier-categories";

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

  it("create schema accepts values without isActive", () => {
    const result = modifierCategorySchema.safeParse({
      restaurantId: "restaurant-1",
      name: "Sauces",
      slug: "sauces",
      description: "Sauce options",
      sortOrder: 1,
    });

    expect(result.success).toBe(true);
  });

  it("create payload does not include isActive", () => {
    const payload = buildModifierCategoryCreatePayload({
      restaurantId: "restaurant-1",
      name: "Sauces",
      slug: "sauces",
      description: "Sauce options",
      sortOrder: 1,
      isActive: false,
    });

    expect(payload).toEqual({
      restaurantId: "restaurant-1",
      name: "Sauces",
      slug: "sauces",
      description: "Sauce options",
      sortOrder: 1,
    });
    expect(payload).not.toHaveProperty("isActive");
  });

  it("update payload can include isActive false", () => {
    const payload = buildModifierCategoryUpdatePayload({
      name: "Sauces",
      isActive: false,
    });

    expect(payload).toEqual({
      name: "Sauces",
      isActive: false,
    });
  });
});
