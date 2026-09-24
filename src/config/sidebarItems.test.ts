import { describe, expect, it } from "vitest";

import { menuItems } from "@/config/sidebarItems";

describe("order management navigation", () => {
  it("keeps order views inside the Orders workspace instead of duplicating sidebar links", () => {
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

    expect(orderManagement?.href).toBe("/orders");
    expect(todayOrdersNavigationItem).toBeUndefined();
    expect(allOrdersNavigationItem).toBeUndefined();
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

describe("legal profile navigation", () => {
  it("exposes the restaurant-scoped legal and tax profile only to owner admins", () => {
    const contentManagement = menuItems.find(
      (item) => item.labelKey === "contentManagement",
    );
    const legalProfile = contentManagement?.children?.find(
      (item) => item.href === "/legal-profile",
    );

    expect(legalProfile).toMatchObject({
      labelKey: "legalProfile",
      roles: ["BUSINESS_ADMIN", "RESTAURANT_ADMIN"],
    });
    expect(legalProfile?.permissionAccesses).toBeUndefined();
    expect(
      contentManagement?.children?.filter(
        (item) => item.href === "/legal-profile",
      ),
    ).toHaveLength(1);
  });
});
