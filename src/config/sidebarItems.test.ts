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

describe("sidebar WinOrder access", () => {
  it("uses the WinOrder permission and allows staff roles", () => {
    const winOrderItem = menuItems.find(
      (item) => item.href === "/integrations/winorder",
    );

    expect(winOrderItem).toMatchObject({
      roles: expect.arrayContaining(["STAFF"]),
      permissionAccesses: ["winorder-integration"],
    });
  });
});
