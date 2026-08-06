import { describe, expect, it } from "vitest";

import { buildOrderTicketHtml, normalizeOrderTicket } from "@/lib/order-ticket";

describe("order ticket", () => {
  it("normalizes order details and escapes customer-provided content", () => {
    const ticket = normalizeOrderTicket({
      id: "order-12345678",
      orderNumber: "AC-42",
      customer: { fullName: "Ada <script>", phone: "123" },
      customerNote: "No <onions>",
      orderTime: "2026-08-07T17:30:00.000Z",
      isScheduled: true,
      deliveryAddress: {
        street: "Main Street",
        houseNumber: "12A",
        postalCode: "45127",
        city: "Essen",
        country: "Germany",
      },
      subtotal: 10,
      taxAmount: 1.9,
      deliveryFee: 2,
      serviceChargeAmount: 0.5,
      tipAmount: 1,
      discountAmount: 2,
      loyaltyDiscountAmount: 0.5,
      walletAppliedAmount: 1,
      totalAmount: 12.5,
      currency: "EUR",
      items: [
        {
          menuItemName: "Pizza & Pasta",
          variationName: "Large",
          quantity: 2,
          menuItem: { category: { name: "Pizza" } },
          snapshotModifiers: [{ name: "Cheese", quantity: 1 }],
        },
      ],
    });

    const html = buildOrderTicketHtml(ticket, "58MM");

    expect(html).toContain("width:50mm");
    expect(html).toContain("Ada &lt;script&gt;");
    expect(html).toContain("Pizza &amp; Pasta");
    expect(html).toContain("No &lt;onions&gt;");
    expect(html).toContain("Preorder time");
    expect(html).toContain("Main Street 12A, 45127 Essen, Germany");
    expect(html).toContain("Delivery fee");
    expect(html).toContain("Service / other charges");
    expect(html).toContain("Tip");
    expect(html).toContain("Discount");
    expect(html).toContain("Pizza");
    expect(html).not.toContain("<script>");
  });

  it.each([
    ["A4", "190mm"],
    ["A5", "132mm"],
    ["80MM", "72mm"],
    ["58MM", "50mm"],
  ] as const)("renders %s content width", (paperSize, width) => {
    expect(
      buildOrderTicketHtml({ id: "order-1", items: [] }, paperSize),
    ).toContain(`width:${width}`);
  });
});
