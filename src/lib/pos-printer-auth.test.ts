import { describe, expect, it } from "vitest";
import {
  getStaffDefaultRedirectPath,
  isPosPrinterAccount,
  isPosPrinterRouteAllowed,
  normalizeAuthPayload,
} from "@/lib/auth";

describe("POS printer session policy", () => {
  const user = normalizeAuthPayload({
    accessToken: "token",
    user: {
      id: "printer-1", email: "printer@example.com", role: "STAFF",
      actorType: "STAFF", accountType: "POS_PRINTER",
      tenantId: "tenant-1", restaurantId: "restaurant-1", branchId: "branch-1",
      staffRole: { permissions: [
        { access: "order-management", operations: ["read", "update"] },
        { access: "table-reservations", operations: ["read", "update"] },
      ] },
    },
  }).user;

  it("preserves account type and routes the account to orders", () => {
    expect(isPosPrinterAccount(user)).toBe(true);
    expect(getStaffDefaultRedirectPath(user)).toBe("/orders");
  });

  it.each(["/orders", "/orders/details/order-1", "/table-reservations"])(
    "allows permitted direct route %s", (route) => expect(isPosPrinterRouteAllowed(route)).toBe(true),
  );

  it.each(["/", "/menu", "/profile", "/auto-printing", "/reports", "/payment-settings"])(
    "blocks unrelated direct route %s", (route) => expect(isPosPrinterRouteAllowed(route)).toBe(false),
  );
});
