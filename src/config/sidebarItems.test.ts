import { describe, expect, it } from "vitest";

import { menuItems } from "@/config/sidebarItems";

describe("sidebar invoice history", () => {
  it("opens restaurant billing invoices instead of customer order invoices", () => {
    const invoiceItem = menuItems
      .flatMap((item) => item.children ?? [])
      .find((item) => item.labelKey === "invoiceHistory");

    expect(invoiceItem).toMatchObject({
      href: "/reports?tab=invoice-history",
      permissionAccesses: ["reports-payouts"],
    });
  });
});
