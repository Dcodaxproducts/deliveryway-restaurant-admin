import { describe, expect, it } from "vitest";

import { menuItems } from "@/config/sidebarItems";

describe("sidebar invoice history", () => {
  it("opens order invoice history for Order Management users", () => {
    const invoiceItem = menuItems
      .flatMap((item) => item.children ?? [])
      .find((item) => item.labelKey === "invoiceHistory");

    expect(invoiceItem).toMatchObject({
      href: "/orders?tab=invoice-history",
      permissionAccesses: ["order-management"],
    });
  });
});
