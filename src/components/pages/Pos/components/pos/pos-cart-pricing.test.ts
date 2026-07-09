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

  it("reconstructs paid modifier totals when the cart row only exposes the base item price", () => {
    const payload = {
      data: {
        quote: {
          subtotal: 9.1,
          totalAmount: 9.1,
        },
        items: [
          {
            id: "cart-item-1",
            menuItemId: "menu-item-1",
            quantity: 1,
            unitPrice: 9.1,
            lineTotal: 9.1,
            selectedModifiers: [
              {
                modifierId: "modifier-tagliatelle",
                name: "Tagliatelle",
                quantity: 1,
                unitPrice: 1,
                total: 1,
              },
              {
                modifierId: "modifier-parmesan",
                name: "Parmesan",
                quantity: 2,
                unitPrice: 4,
                total: 8,
              },
            ],
            menuItem: {
              id: "menu-item-1",
              name: "Pasta",
              unitPrice: 9.1,
            },
          },
        ],
      },
    };

    const [item] = formatPosCartItems(payload);
    const billing = formatPosCartBilling(payload, [item]);

    expect(item.unitPrice).toBe(18.1);
    expect(item.lineTotal).toBe(18.1);
    expect(billing.subtotal).toBe(18.1);
    expect(billing.totalAmount).toBe(18.1);
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
        type: "ITEM",
        menuItemId: "menu-item-1",
        name: "Lahori Chicken Pizza",
        unitPrice: 41,
        originalUnitPrice: 41,
        lineTotal: 41,
        originalLineTotal: 41,
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

  it("formats grouped fixed deal cart rows", () => {
    const [item] = formatPosCartItems({
      data: {
        items: [
          {
            id: "deal:deal-1",
            type: "DEAL",
            dealId: "deal-1",
            quantity: 2,
            unitPriceWithModifiers: 15,
            lineTotal: 30,
            deal: {
              id: "deal-1",
              title: "Lunch combo",
            },
          },
        ],
      },
    });

    expect(item).toMatchObject({
      id: "deal:deal-1",
      type: "DEAL",
      dealId: "deal-1",
      name: "Lunch combo",
      quantity: 2,
      lineTotal: 30,
    });
  });

  it("falls back to line totals when no quote is available", () => {
    const billing = formatPosCartBilling({}, [
      {
        id: "cart-item-1",
        type: "ITEM",
        menuItemId: "menu-item-1",
        name: "Pizza",
        unitPrice: 41,
        originalUnitPrice: 41,
        lineTotal: 82,
        originalLineTotal: 82,
        quantity: 2,
        modifiers: [],
      },
    ]);

    expect(billing.subtotal).toBe(82);
    expect(billing.totalAmount).toBe(82);
  });
});
