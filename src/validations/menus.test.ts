import { describe, expect, it } from "vitest";

import { menuItemSchema } from "@/validations/menus";

const baseMenuItem = {
  name: "Pizza",
  restaurantId: "restaurant-1",
};

describe("menu item modifier required validation", () => {
  it("accepts modifier-level isRequired in modifiers", () => {
    const result = menuItemSchema.parse({
      ...baseMenuItem,
      modifiers: [{ modifierId: "modifier-1", priceDelta: 2, isRequired: true }],
    });

    expect(result.modifiers).toEqual([
      { modifierId: "modifier-1", priceDelta: 2, isRequired: true },
    ]);
  });

  it("defaults missing modifier isRequired to false", () => {
    const result = menuItemSchema.parse({
      ...baseMenuItem,
      modifiers: [{ modifierId: "modifier-1", priceDelta: 2 }],
    });

    expect(result.modifiers).toEqual([
      { modifierId: "modifier-1", priceDelta: 2, isRequired: false },
    ]);
  });

  it("accepts modifier-level isRequired in modifier price overrides", () => {
    const result = menuItemSchema.parse({
      ...baseMenuItem,
      modifierPriceOverrides: [
        { modifierId: "modifier-1", priceDelta: 2, isRequired: true },
      ],
    });

    expect(result.modifierPriceOverrides).toEqual([
      { modifierId: "modifier-1", priceDelta: 2, isRequired: true },
    ]);
  });

  it("defaults missing modifier price override isRequired to false", () => {
    const result = menuItemSchema.parse({
      ...baseMenuItem,
      modifierPriceOverrides: [{ modifierId: "modifier-1", priceDelta: 2 }],
    });

    expect(result.modifierPriceOverrides).toEqual([
      { modifierId: "modifier-1", priceDelta: 2, isRequired: false },
    ]);
  });

  it("does not add root isRequired to schema output", () => {
    const result = menuItemSchema.parse({
      ...baseMenuItem,
      isRequired: true,
    });

    expect(result).not.toHaveProperty("isRequired");
  });

  it("keeps nested variation modifier overrides price-only", () => {
    const result = menuItemSchema.parse({
      ...baseMenuItem,
      variationPriceOverrides: [
        {
          variationId: "variation-1",
          price: 10,
          pickupPrice: 0,
          displayText: "Small",
          modifierPriceOverrides: [
            { modifierId: "modifier-1", priceDelta: 2, isRequired: true },
          ],
        },
      ],
    });

    expect(
      result.variationPriceOverrides[0]?.modifierPriceOverrides[0]
    ).toEqual({ modifierId: "modifier-1", priceDelta: 2 });
  });
});
