import { describe, expect, it } from "vitest";

import {
  attachModifierToGroupSchema,
  modifierGroupSchema,
} from "@/validations/modifier-groups";

describe("modifier group validation", () => {
  it("accepts a valid create group payload", () => {
    const result = modifierGroupSchema.safeParse({
      restaurantId: "restaurant-1",
      name: "Choose Sauces",
      description: "Pick your sauces",
      minSelect: 0,
      maxSelect: 3,
      sortOrder: 1,
    });

    expect(result.success).toBe(true);
    expect(result.data?.name).toBe("Choose Sauces");
    expect(result.data).not.toHaveProperty("isActive");
  });

  it("requires name when creating a group", () => {
    const result = modifierGroupSchema.safeParse({
      restaurantId: "restaurant-1",
      name: "",
      minSelect: 0,
      maxSelect: 3,
      sortOrder: 1,
    });

    expect(result.success).toBe(false);
  });

  it("rejects maxSelect values below minSelect", () => {
    const result = modifierGroupSchema.safeParse({
      restaurantId: "restaurant-1",
      name: "Choose Sauces",
      minSelect: 2,
      maxSelect: 1,
      sortOrder: 1,
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["maxSelect"]);
  });

  it("validates attach modifier payloads", () => {
    const result = attachModifierToGroupSchema.safeParse({
      modifierId: "modifier-1",
      sortOrder: "2",
    });

    expect(result.success).toBe(true);
    expect(result.data?.sortOrder).toBe(2);
  });

  it("requires modifierId when attaching a modifier", () => {
    const result = attachModifierToGroupSchema.safeParse({
      modifierId: "",
      sortOrder: 1,
    });

    expect(result.success).toBe(false);
  });
});
