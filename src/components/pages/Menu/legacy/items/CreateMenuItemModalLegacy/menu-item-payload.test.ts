import { describe, expect, it } from "vitest";

import {
  buildMenuItemPayload,
  getInitialForm,
} from "@/components/pages/Menu/legacy/items/CreateMenuItemModalLegacy/CreateMenuItemModal";
import { normalizeMenuItemModifierGroups } from "@/lib/modifier-group-assignment-utils";

const baseForm = {
  name: "Pizza",
  categoryId: "category-1",
  basePrice: "10",
  modifierIds: ["modifier-1"],
  modifierPriceOverrides: [
    { modifierId: "modifier-1", priceDelta: "2", isRequired: true },
  ],
  variationIds: [],
  variationPriceOverrides: [],
  isActive: true,
};

describe("menu item modifier required payload", () => {
  it("includes modifier-level isRequired in create payload modifiers", () => {
    const payload = buildMenuItemPayload({
      form: baseForm,
      restaurantId: "restaurant-1",
    });

    expect(payload.modifiers).toEqual([
      { modifierId: "modifier-1", priceDelta: 2, isRequired: true },
    ]);
  });

  it("includes modifier-level isRequired in create payload modifier price overrides", () => {
    const payload = buildMenuItemPayload({
      form: {
        ...baseForm,
        modifierPriceOverrides: [{ modifierId: "modifier-1", priceDelta: "2" }],
      },
      restaurantId: "restaurant-1",
    });

    expect(payload.modifierPriceOverrides).toEqual([
      { modifierId: "modifier-1", priceDelta: 2, isRequired: false },
    ]);
  });

  it("defaults missing modifier-level isRequired to false during edit hydration", () => {
    const form = getInitialForm("restaurant-1", {
      id: "item-1",
      name: "Pizza",
      modifierPriceOverrides: [{ modifierId: "modifier-1", priceDelta: 2 }],
    });

    expect(form.modifierPriceOverrides).toEqual([
      { modifierId: "modifier-1", priceDelta: "2", isRequired: false },
    ]);
  });

  it("normalizes menu item modifierGroups for Step 4 assignment hydration", () => {
    const form = getInitialForm("restaurant-1", {
      id: "item-1",
      name: "Pizza",
      modifierGroups: [
        {
          id: "group-bread",
          name: "Choose Bread",
          description: "Pick one bread",
          selectionType: "SINGLE",
          minSelect: 1,
          maxSelect: 1,
          sortOrder: 1,
          modifiers: [
            {
              id: "modifier-white-bread",
              name: "White Bread",
              priceDelta: 0,
              sortOrder: 1,
              category: {
                id: "modifier-category-bread",
                name: "Bread",
                slug: "bread",
              },
            },
          ],
        },
      ],
    });

    expect(form.modifierGroupAssignments).toEqual([
      {
        groupId: "group-bread",
        group: {
          id: "group-bread",
          name: "Choose Bread",
          description: "Pick one bread",
        },
        id: "group-bread",
        itemId: undefined,
        selectionType: "SINGLE",
        minSelect: 1,
        maxSelect: 1,
        sortOrder: 1,
      },
    ]);
  });

  it("normalizes menu item response modifierGroups with modifiers and category", () => {
    const groups = normalizeMenuItemModifierGroups([
      {
        id: "group-bread",
        name: "Choose Bread",
        description: "Pick one bread",
        selectionType: "SINGLE",
        minSelect: 1,
        maxSelect: 1,
        sortOrder: 1,
        modifiers: [
          {
            id: "modifier-white-bread",
            name: "White Bread",
            priceDelta: 0,
            sortOrder: 1,
            category: {
              id: "modifier-category-bread",
              name: "Bread",
              slug: "bread",
            },
          },
        ],
      },
    ]);

    expect(groups).toEqual([
      {
        id: "group-bread",
        groupId: "group-bread",
        name: "Choose Bread",
        description: "Pick one bread",
        selectionType: "SINGLE",
        minSelect: 1,
        maxSelect: 1,
        isRequired: true,
        sortOrder: 1,
        modifiers: [
          {
            id: "modifier-white-bread",
            name: "White Bread",
            priceDelta: 0,
            sortOrder: 1,
            category: {
              id: "modifier-category-bread",
              name: "Bread",
              slug: "bread",
            },
          },
        ],
      },
    ]);
  });

  it("does not send item-level isRequired in menu item payloads", () => {
    const payload = buildMenuItemPayload({
      form: {
        ...baseForm,
        isRequired: true,
      },
      restaurantId: "restaurant-1",
    });

    expect(payload).not.toHaveProperty("isRequired");
  });

  it("does not add isRequired to nested variation modifier overrides", () => {
    const payload = buildMenuItemPayload({
      form: {
        ...baseForm,
        variationIds: ["variation-1"],
        variationPriceOverrides: [
          {
            variationId: "variation-1",
            price: "12",
            pickupPrice: "0",
            displayText: "Large",
            modifierPriceOverrides: [
              {
                modifierId: "modifier-1",
                priceDelta: "3",
                isRequired: true,
              },
            ],
          },
        ],
      },
      restaurantId: "restaurant-1",
    });

    expect(
      payload.variationPriceOverrides[0]?.modifierPriceOverrides[0]
    ).toEqual({ modifierId: "modifier-1", priceDelta: 3 });
  });
});
