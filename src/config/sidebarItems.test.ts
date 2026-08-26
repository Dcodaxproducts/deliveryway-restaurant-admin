import { describe, expect, it } from "vitest";

import { menuItems } from "@/config/sidebarItems";

describe("order management navigation", () => {
  it("opens All Orders with the Today's Orders page tab selected", () => {
    const orderManagement = menuItems.find(
      (item) => item.labelKey === "orderManagement",
    );
    const todayOrdersNavigationItem = orderManagement?.children?.find(
      (item) => item.labelKey === "todayOrders",
    );
    const allOrdersNavigationItem = orderManagement?.children?.find(
      (item) => item.labelKey === "allOrders",
    );
    const invoiceItem = menuItems
      .flatMap((item) => item.children ?? [])
      .find((item) => item.labelKey === "invoiceHistory");

    expect(orderManagement?.href).toBe("/orders?tab=today");
    expect(todayOrdersNavigationItem).toBeUndefined();
    expect(allOrdersNavigationItem?.href).toBe("/orders?tab=today");
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
