import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const projectFile = (path: string) =>
  readFileSync(join(process.cwd(), path), "utf8");

describe("Partner UI review feedback", () => {
  it("does not repeat deliveryman and loyalty page copy inside their cards", () => {
    const deliverymanForm = projectFile(
      "src/components/pages/Deliverymen/forms/DeliverymanForm.tsx",
    );
    const loyaltySettings = projectFile(
      "src/components/pages/Loyalty/components/loyalty/LoyaltyProgramSettings.tsx",
    );

    expect(deliverymanForm).not.toContain('description={t("manageDetails")}');
    expect(loyaltySettings).not.toContain('t("programSettingsTitle")');
  });

  it("keeps one Happy Hour create action and uses a canonical content surface", () => {
    const page = projectFile(
      "src/components/pages/Promotions/components/PromotionManagement/HappyHourPage/HappyHourPage.tsx",
    );
    const table = projectFile(
      "src/components/pages/Promotions/components/PromotionManagement/HappyHourPage/table.tsx",
    );

    expect(page).toContain("<SectionCard");
    expect(page).toContain('actionHref="/promotion-management/happy-hour/add"');
    expect(table).not.toContain("PromotionCreateLink");
    expect(table).not.toContain('href="/promotion-management/happy-hour/add"');
  });

  it("uses the standard reusable button size for printing actions", () => {
    const printing = projectFile(
      "src/components/pages/Printing/components/autoPrinting/AutoPrintingSettings.tsx",
    );

    expect(printing).not.toMatch(/size="sm"[\s\S]{0,220}t\("connect"\)/);
    expect(printing).not.toMatch(/size="sm"[\s\S]{0,220}t\("saveSettings"\)/);
  });

  it("uses canonical, balanced payment and storefront settings surfaces", () => {
    const payment = projectFile(
      "src/components/pages/Settings/forms/SettingsForm.tsx",
    );
    const storefront = projectFile(
      "src/components/pages/Settings/pages/StorefrontSettingsPage.tsx",
    );
    const colors = projectFile(
      "src/components/pages/Settings/theme/components/theme-settings/color-scheme-section.tsx",
    );

    expect(payment).toContain("<SectionCard");
    expect(payment).toContain("xl:grid-cols-2");
    expect(payment).not.toContain("<DetailPanel");
    expect(storefront).toContain('className="space-y-5"');
    expect(colors).toContain("md:grid-cols-2");
  });
});
