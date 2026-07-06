import { describe, expect, it } from "vitest";

import {
  buildPosAddToCartModifierSelections,
  flattenPosAddToCartModifierSelections,
} from "@/components/pages/Pos/legacy/cart/add-to-cart-payload";

describe("POS add-to-cart payload", () => {
  it("preserves modifier group context and selected quantities", () => {
    const modifierSelections = buildPosAddToCartModifierSelections({
      "group-pasta": [
        { id: "modifier-tagliatelle", selectedQuantity: 1 },
        { id: "modifier-parmesan", selectedQuantity: 2 },
      ],
    });

    expect(modifierSelections).toEqual([
      {
        modifierGroupId: "group-pasta",
        modifiers: [
          { modifierId: "modifier-tagliatelle", quantity: 1 },
          { modifierId: "modifier-parmesan", quantity: 2 },
        ],
      },
    ]);
    expect(flattenPosAddToCartModifierSelections(modifierSelections)).toEqual([
      { modifierId: "modifier-tagliatelle", quantity: 1 },
      { modifierId: "modifier-parmesan", quantity: 2 },
    ]);
  });
});
