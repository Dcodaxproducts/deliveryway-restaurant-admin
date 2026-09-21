import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const projectFile = (path: string) =>
  readFileSync(join(process.cwd(), path), "utf8");

describe("Phase 3 remaining Partner workflows", () => {
  it("uses canonical presentation owners for deliveryman create and edit", () => {
    const page = projectFile(
      "src/components/pages/deliverymen/pages/AddDeliverymanPage.tsx",
    );
    const form = projectFile(
      "src/components/pages/Deliverymen/forms/DeliverymanForm.tsx",
    );

    expect(page).toContain("<PageHeader");
    expect(page).toContain("<FormLayout");
    expect(page).toContain("<FormActions");
    expect(form).toContain("<FormSection");
    expect(form).toContain("<FormField");
    expect(page).not.toContain("<AddDeliveryManHeader");
  });

  it("preserves deliveryman scope, validation, and mutation contracts", () => {
    const page = projectFile(
      "src/components/pages/deliverymen/pages/AddDeliverymanPage.tsx",
    );

    expect(page).toContain("deliverymanSchema.omit");
    expect(page).toContain("useCreateDeliveryman");
    expect(page).toContain("useUpdateDeliveryman");
    expect(page).toContain("isBranchAdmin ? authBranchId : values.branchId");
    expect(page).toContain('const formId = "deliveryman-form"');
    expect(page).toContain("id={formId}");
    expect(page).toContain("form={formId}");
  });

  it("uses canonical page, section, state, and status owners for search", () => {
    const search = projectFile(
      "src/components/pages/Search/SearchPage.tsx",
    );

    expect(search).toContain("<PageHeader");
    expect(search).toContain("<SectionCard");
    expect(search).toContain("<StatePanel");
    expect(search).toContain("<StatusBadge");
    expect(search).toContain("useGlobalSearch({");
    expect(search).toContain("buildSearchHref");
  });

  it("uses canonical surfaces for chat loading and unavailable restaurant creation", () => {
    const chat = projectFile(
      "src/components/pages/notifications/chat/pages/LiveChatPage.tsx",
    );
    const restaurant = projectFile(
      "src/components/pages/settings/restaurants/pages/AddRestaurantPage.tsx",
    );

    expect(chat).toContain("<PageHeader");
    expect(chat).toContain("<SectionCard");
    expect(chat).toMatch(/<StatePanel\s+state="loading"/);
    expect(restaurant).toContain("<PageHeader");
    expect(restaurant).toMatch(/<StatePanel\s+state="unavailable"/);
  });

  it("uses the canonical form system for FAQ creation and editing", () => {
    const faq = projectFile(
      "src/components/pages/Settings/faqs/components/faqs/CreateFAQPage.tsx",
    );

    expect(faq).toContain("<PageHeader");
    expect(faq).toContain("<FormLayout");
    expect(faq).toContain("<FormSection");
    expect(faq).toContain("<FormField");
    expect(faq).toContain("<FormActions");
    expect(faq).toContain("useCreateFaq()");
    expect(faq).toContain("useUpdateFaq()");
    expect(faq).toContain('router.push("/faqs")');
  });

  it("uses the canonical detail system for category details", () => {
    const category = projectFile(
      "src/components/pages/Menu/CategoryDetails.tsx",
    );

    expect(category).toContain("<PageHeader");
    expect(category).toContain("<DetailLayout");
    expect(category).toContain("<DetailPanel");
    expect(category).toContain("<InfoList");
    expect(category).toContain("<StatePanel");
    expect(category).toContain("<StatusBadge");
    expect(category).not.toMatch(/:\s*any\b/);
    expect(category).toContain("useGetMenuCategoryById(id)");
  });

  it("uses the canonical form and state system for deal forms", () => {
    const form = projectFile(
      "src/components/pages/Menu/deals/components/AdminDealForm.tsx",
    );
    const add = projectFile(
      "src/components/pages/Menu/deals/pages/AddAdminDealPage.tsx",
    );
    const edit = projectFile(
      "src/components/pages/Menu/deals/pages/EditAdminDealPage.tsx",
    );

    expect(form).toContain("<PageWrapper");
    expect(form).toContain("<Section");
    expect(form).toContain("<FormActions");
    expect(add).not.toContain("<Container>");
    expect(edit).toContain('<StatePanel\n          state="loading"');
    expect(edit).toContain('<StatePanel\n          state="error"');
    expect(add).toContain("useCreateAdminDeal()");
    expect(edit).toContain("useUpdateAdminDeal()");
  });

  it("uses the canonical settings system for global and storefront settings", () => {
    const globalSettings = projectFile(
      "src/components/pages/settings/pages/GlobalSettingsPage.tsx",
    );
    const storefront = projectFile(
      "src/components/pages/Settings/pages/StorefrontSettingsPage.tsx",
    );

    expect(globalSettings).toContain("<PageHeader");
    expect(globalSettings).toContain("<SettingsLayout>");
    expect(storefront).toContain("<PageHeader");
    expect(storefront).toContain("<SettingsLayout");
    expect(storefront).toContain("<FormActions");
    expect(storefront).toContain("<StatePanel");
    expect(storefront).toContain("saveBranding(values)");
    expect(storefront).toContain("resetBranding()");
  });

  it("uses the canonical settings and tab owners for WinOrder", () => {
    const winOrder = projectFile(
      "src/components/pages/WinOrder/WinOrderSettingsPage.tsx",
    );

    expect(winOrder).toContain("<PageHeader");
    expect(winOrder).toContain("<SettingsLayout>");
    expect(winOrder).toContain("<PageTabs");
    expect(winOrder).toContain("createWinOrderConnection");
    expect(winOrder).toContain("replaceWinOrderCatalogMappings");
    expect(winOrder).toContain("retryFailedWinOrderExports");
  });
});
