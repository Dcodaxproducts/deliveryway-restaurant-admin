import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const projectFile = (path: string) =>
  readFileSync(join(process.cwd(), path), "utf8");

describe("Phase 3 order, POS, and payment screen family", () => {
  it("uses the canonical page, state, detail, action, and settings owners", () => {
    const orderDetails = projectFile(
      "src/components/pages/orders/pages/OrderDetailsPage.tsx",
    );
    const groupOrder = projectFile(
      "src/components/pages/orders/pages/GroupOrderDetailsPage.tsx",
    );
    const pos = projectFile("src/components/pages/pos/pages/PosPage.tsx");
    const posHeader = projectFile(
      "src/components/pages/Pos/components/pos/header.tsx",
    );
    const posSearch = projectFile(
      "src/components/pages/Pos/components/pos/PosSearchFilter.tsx",
    );
    const menuCard = projectFile("src/components/cards/MenuItemCard.tsx");
    const payments = projectFile(
      "src/components/pages/Settings/pages/PaymentSettingsPage.tsx",
    );

    expect(orderDetails).toContain("<Container width=\"wide\">");
    expect(orderDetails).toContain("<DetailLayout aside=");
    expect(orderDetails).toContain("<StatePanel");
    expect(groupOrder).toContain("<DetailLayout>");
    expect(groupOrder).toContain("<DetailPanel");
    expect(groupOrder).toContain("<InfoList");
    expect(groupOrder).toContain("<Badge");
    expect(pos).toContain("<DetailLayout");
    expect(pos).toContain("<DetailPanel padding=\"none\">");
    expect(posHeader).toContain("actions={");
    expect(posSearch).toContain("<FilterBar");
    expect(menuCard).toContain('density === "compact"');
    expect(payments).toContain("<SettingsLayout>");
  });

  it("preserves order, POS catalog, reservation, and payment contracts", () => {
    const orderDetails = projectFile(
      "src/components/pages/orders/pages/OrderDetailsPage.tsx",
    );
    const groupOrder = projectFile(
      "src/components/pages/orders/pages/GroupOrderDetailsPage.tsx",
    );
    const pos = projectFile("src/components/pages/pos/pages/PosPage.tsx");
    const posHeader = projectFile(
      "src/components/pages/Pos/components/pos/header.tsx",
    );
    const settingsForm = projectFile(
      "src/components/pages/Settings/forms/SettingsForm.tsx",
    );

    expect(orderDetails).toContain("useGetOrderById(orderId as string)");
    expect(orderDetails).toContain("silenceOrderAlert(orderId)");
    expect(groupOrder).toContain("useGetOrderById(orderId as string)");
    expect(pos).toContain("useGetMenuItems({");
    expect(pos).toContain("categoryId: selectedCategory || undefined");
    expect(posHeader).toContain("<MakeReservationModal");
    expect(settingsForm).toContain("<RestaurantPaymentMethodsSection");
    expect(settingsForm).toContain("<RestaurantWalletPayoutSection");
  });

  it("keeps new workflow pages free of untyped any collections", () => {
    const groupOrder = projectFile(
      "src/components/pages/orders/pages/GroupOrderDetailsPage.tsx",
    );
    const pos = projectFile("src/components/pages/pos/pages/PosPage.tsx");

    expect(groupOrder).not.toMatch(/:\s*any\b/);
    expect(pos).not.toMatch(/:\s*any\b/);
  });
});
