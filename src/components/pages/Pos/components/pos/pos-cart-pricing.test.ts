import { describe, expect, it } from "vitest";

import {
  formatPosCartBilling,
  formatPosCartItems,
} from "@/components/pages/Pos/components/pos/pos-cart-pricing";

describe("pos cart pricing", () => {
  it("uses modifier-inclusive cart item prices from the API", () => {
    const payload = {
      data: {
        items: [
          {
            id: "cart-item-1",
            menuItemId: "menu-item-1",
            quantity: 1,
            unitPrice: 20,
            modifiersTotal: 21,
            unitPriceWithModifiers: 41,
            lineTotal: 41,
            selectedModifiers: [
              {
                modifierId: "modifier-1",
                name: "Lahori pizza modifier",
                quantity: 1,
                unitPrice: 21,
                total: 21,
              },
            ],
            menuItem: {
              id: "menu-item-1",
              name: "Lahori Chicken Pizza",
              unitPrice: 20,
              imageUrl: "https://example.com/pizza.png",
            },
          },
        ],
      },
    };

    const [item] = formatPosCartItems(payload);

    expect(item.name).toBe("Lahori Chicken Pizza");
    expect(item.unitPrice).toBe(41);
    expect(item.lineTotal).toBe(41);
    expect(item.modifiers).toEqual([
      {
        id: "modifier-1",
        name: "Lahori pizza modifier",
        quantity: 1,
        unitPrice: 21,
        total: 21,
      },
    ]);
  });

  it("prefers backend quote totals for billing", () => {
    const payload = {
      data: {
        quote: {
          subtotal: 41,
          deliveryFee: 2,
          discountAmount: 20,
          totalAmount: 23,
        },
      },
    };
    const billing = formatPosCartBilling(payload, [
      {
        id: "cart-item-1",
        menuItemId: "menu-item-1",
        name: "Lahori Chicken Pizza",
        unitPrice: 41,
        lineTotal: 41,
        quantity: 1,
        modifiers: [],
      },
    ]);

    expect(billing).toMatchObject({
      subtotal: 41,
      deliveryFee: 2,
      discountAmount: 20,
      totalAmount: 23,
    });
  });

  it("falls back to line totals when no quote is available", () => {
    const billing = formatPosCartBilling({}, [
      {
        id: "cart-item-1",
        menuItemId: "menu-item-1",
        name: "Pizza",
        unitPrice: 41,
        lineTotal: 82,
        quantity: 2,
        modifiers: [],
      },
    ]);

    expect(billing.subtotal).toBe(82);
    expect(billing.totalAmount).toBe(82);
  });
});
