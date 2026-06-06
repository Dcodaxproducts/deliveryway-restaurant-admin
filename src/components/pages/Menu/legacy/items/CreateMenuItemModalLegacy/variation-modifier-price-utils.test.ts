import { describe, expect, it } from "vitest";

import {
  flattenModifierGroupsForMatrix,
  hydrateVariationModifierPriceMatrix,
  mergeMatrixCellsIntoVariationOverrides,
  pruneVariationModifierPriceMatrix,
} from "./variation-modifier-price-utils";

describe("variation modifier price matrix utilities", () => {
  it("flattens modifier groups and dedupes modifier ids", () => {
    const result = flattenModifierGroupsForMatrix([
      {
        id: "group-1",
        name: "Sauces",
        modifiers: [
          {
            id: "modifier-1",
            name: "Garlic",
            priceDelta: 50,
            category: { id: "category-1", name: "Sauce" },
          },
        ],
      },
      {
        id: "group-2",
        name: "Extras",
        modifiers: [
          { id: "modifier-1", name: "Garlic duplicate", priceDelta: 80 },
          { id: "modifier-2", name: "Cheese", priceDelta: 100 },
        ],
      },
    ]);

    expect(result).toEqual([
      {
        id: "modifier-1",
        name: "Garlic",
        groupId: "group-1",
        groupName: "Sauces",
        priceDelta: 50,
        category: { id: "category-1", name: "Sauce" },
      },
      {
        id: "modifier-2",
        name: "Cheese",
        groupId: "group-2",
        groupName: "Extras",
        priceDelta: 100,
        category: null,
      },
    ]);
  });

  it("removes cells for deleted variations or modifiers while keeping zero", () => {
    const result = pruneVariationModifierPriceMatrix({
      cells: [
        { variationId: "variation-1", modifierId: "modifier-1", priceDelta: 0 },
        { variationId: "variation-2", modifierId: "modifier-1", priceDelta: 50 },
        { variationId: "variation-1", modifierId: "modifier-2", priceDelta: 75 },
        { variationId: "variation-1", modifierId: "modifier-1", priceDelta: null },
      ],
      variationIds: ["variation-1"],
      modifierIds: ["modifier-1"],
    });

    expect(result).toEqual([
      { variationId: "variation-1", modifierId: "modifier-1", priceDelta: 0 },
    ]);
  });

  it("hydrates existing nested overrides into matrix cells", () => {
    expect(
      hydrateVariationModifierPriceMatrix([
        {
          variationId: "variation-1",
          modifierPriceOverrides: [
            { modifierId: "modifier-1", priceDelta: 0 },
            { modifierId: "modifier-2", priceDelta: "75" },
          ],
        },
      ])
    ).toEqual([
      { variationId: "variation-1", modifierId: "modifier-1", priceDelta: 0 },
      { variationId: "variation-1", modifierId: "modifier-2", priceDelta: 75 },
    ]);
  });

  it("merges explicit matrix cells into variation overrides and omits empty cells", () => {
    expect(
      mergeMatrixCellsIntoVariationOverrides({
        variationPriceOverrides: [
          {
            variationId: "variation-1",
            price: 800,
            pickupPrice: 700,
            displayText: "Small",
          },
        ],
        cells: [
          { variationId: "variation-1", modifierId: "modifier-1", priceDelta: 0 },
          {
            variationId: "variation-1",
            modifierId: "modifier-2",
            priceDelta: null,
          },
        ],
      })
    ).toEqual([
      {
        variationId: "variation-1",
        price: 800,
        pickupPrice: 700,
        displayText: "Small",
        modifierPriceOverrides: [
          { modifierId: "modifier-1", priceDelta: 0 },
        ],
      },
    ]);
  });
});
