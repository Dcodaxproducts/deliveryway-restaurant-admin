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
