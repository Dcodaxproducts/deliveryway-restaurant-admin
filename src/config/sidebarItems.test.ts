import { describe, expect, it } from "vitest";

import { menuItems } from "@/config/sidebarItems";

describe("order management navigation", () => {
  it("defaults to today's orders and removes duplicate invoice history", () => {
    const orderManagement = menuItems.find(
      (item) => item.labelKey === "orderManagement",
    );
    const invoiceItem = menuItems
      .flatMap((item) => item.children ?? [])
      .find((item) => item.labelKey === "invoiceHistory");

    expect(orderManagement?.href).toBe("/orders?tab=today");
    expect(orderManagement?.children?.[0]?.href).toBe("/orders?tab=today");
    expect(invoiceItem).toBeUndefined();
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
