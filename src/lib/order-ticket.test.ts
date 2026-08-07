import { describe, expect, it } from "vitest";

import { buildOrderTicketHtml, normalizeOrderTicket } from "@/lib/order-ticket";

describe("order ticket", () => {
  it("normalizes order details and escapes customer-provided content", () => {
    const ticket = normalizeOrderTicket({
      id: "order-12345678",
      orderNumber: "AC-42",
      customer: { fullName: "Ada <script>", phone: "123" },
      customerNote: "No <onions>",
      totalAmount: 12.5,
      currency: "EUR",
      items: [
        {
          menuItemName: "Pizza & Pasta",
          variationName: "Large",
          quantity: 2,
          snapshotModifiers: [{ name: "Cheese", quantity: 1 }],
        },
      ],
    });

    const html = buildOrderTicketHtml(ticket, "58MM");

    expect(html).toContain("width:50mm");
    expect(html).toContain("Ada &lt;script&gt;");
    expect(html).toContain("Pizza &amp; Pasta");
    expect(html).toContain("No &lt;onions&gt;");
    expect(html).not.toContain("<script>");
  });

  it("prints complete order, modifier, scheduling, fee, and payment details", () => {
    const ticket = normalizeOrderTicket({
      id: "order-complete",
      orderType: "DELIVERY",
      createdAt: "2026-08-07T10:00:00.000Z",
      orderTime: "2026-08-08T18:30:00.000Z",
      isScheduled: true,
      customer: {
        fullName: "Ada Lovelace",
        email: "ada@example.com",
        phone: "+49 123",
      },
      deliveryAddress: {
        street: "Main Street 1",
        postalCode: "10115",
        city: "Berlin",
        country: "DE",
      },
      customerNote: "Ring the bell",
      paymentMethod: "CASH_ON_DELIVERY",
      subtotal: 20,
      taxAmount: 1.4,
      deliveryFee: 2.5,
      serviceChargeAmount: 1,
      tipAmount: 2,
      discountAmount: 1,
      loyaltyDiscountAmount: 0.5,
      walletAppliedAmount: 0,
      totalAmount: 25.4,
      currency: "EUR",
      items: [
        {
          menuItemName: "Pizza",
          variationName: "Large",
          quantity: 1,
          lineTotal: 20,
          note: "No onions",
          snapshotModifiers: {
            modifiers: [{ name: "Extra cheese", quantity: 2 }],
          },
        },
      ],
    });

    const html = buildOrderTicketHtml(ticket, "80MM");

    expect(html).toContain("ada@example.com");
    expect(html).toContain("Main Street 1, 10115 Berlin, DE");
    expect(html).toContain("Extra cheese × 2");
    expect(html).toContain("Special instructions: No onions");
    expect(html).toContain("Delivery fee:");
    expect(html).toContain("Service charge:");
    expect(html).toContain("Payment method:</strong> CASH_ON_DELIVERY");
    expect(html).toContain("Ring the bell");
    expect(html).toContain("PRE-ORDER / VORBESTELLUNG");
    expect(html).not.toContain("Not scheduled");
  });

  it("marks immediate tickets as ASAP", () => {
    const html = buildOrderTicketHtml(
      { id: "order-immediate", isScheduled: false, items: [] },
      "80MM",
    );

    expect(html).toContain("ASAP / SOFORT");
    expect(html).not.toContain("PRE-ORDER / VORBESTELLUNG");
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
